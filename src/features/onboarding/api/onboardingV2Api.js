import { supabase } from '../../../lib/supabase';
import { BUSINESS_TYPE_OPTIONS } from '../../../constants/businessTypeOptions';
import { getSession } from '../../auth/api/auth';
import {
  fetchBusinessAvailability,
  saveBusinessAvailability,
} from '../../availability/api/availability';
import {
  buildWeeklySchedulePayloadFromUi,
  normalizeTimeOffBlocksForSave,
} from '../../availability/utils/availabilityModel';
import { updateBusinessSlug } from '../../more/api/updateBusinessSlug';
import {
  deleteAllBusinessServicesForBusiness,
  insertBusinessService,
} from '../../services/api/services';

function isAllowedBusinessType(value) {
  const v = String(value ?? '').trim();
  return BUSINESS_TYPE_OPTIONS.some((o) => o.value === v);
}

function clampOnboardingStep(n) {
  const x = Number(n);
  if (!Number.isFinite(x) || x < 1) {
    return 1;
  }
  return Math.min(5, Math.floor(x));
}

/**
 * Reads `profiles.onboarding_step` so we never downgrade progress when re-saving an earlier step.
 */
async function readProfileOnboardingStep(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_step')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) {
    return {
      ok: false,
      error: new Error(error.message ?? 'Could not read onboarding progress'),
      step: 1,
    };
  }
  return { ok: true, step: clampOnboardingStep(data?.onboarding_step) };
}

/**
 * Sets `profiles.onboarding_step` to at least `minStep` (never lowers an existing higher step).
 */
async function updateProfileOnboardingStepAtLeast(userId, minStep) {
  const read = await readProfileOnboardingStep(userId);
  const current = read.ok ? read.step : 1;
  const next = Math.max(current, clampOnboardingStep(minStep));
  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: next })
    .eq('user_id', userId);
  if (error) {
    return { ok: false, error: new Error(error.message ?? 'Could not update onboarding progress') };
  }
  return { ok: true };
}

/**
 * Stable public identifier for `business_profiles.public_id` (NOT NULL, UNIQUE).
 * Uses UUID v4 hex (32 chars) when `crypto.randomUUID` exists (see `index.js` polyfill).
 */
function generatePublicId() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID().replace(/-/g, '');
  }
  const a = Date.now().toString(36);
  const b = Math.random().toString(36).slice(2, 14);
  return `${a}${b}`.replace(/[^a-z0-9]/gi, '').slice(0, 32) || `pid${a}${b}`;
}

/**
 * Onboarding step 1 via Supabase: upsert `business_profiles` (name + type), then set
 * `profiles.onboarding_status = 'in_progress'` and `onboarding_step = 2`.
 *
 * @param {{ businessName: string; businessType: string }} input
 * @returns {Promise<{ ok: true } | { ok: false; error: Error }>}
 */
export async function saveOnboardingStep1({ businessName, businessType }) {
  const name = String(businessName ?? '').trim();
  const type = String(businessType ?? '').trim();
  if (!name || !type || !isAllowedBusinessType(type)) {
    return { ok: false, error: new Error('Enter a valid business name and type.') };
  }

  const { data: sessWrap } = await getSession();
  const userId = sessWrap?.session?.user?.id;
  if (!userId) {
    return { ok: false, error: new Error('Not signed in') };
  }

  const { data: existing, error: readBpError } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (readBpError) {
    return {
      ok: false,
      error: new Error(readBpError.message ?? 'Could not load business profile'),
    };
  }

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from('business_profiles')
      .update({
        business_name: name,
        business_type: type,
      })
      .eq('id', existing.id)
      .eq('profile_id', userId);

    if (upErr) {
      return { ok: false, error: new Error(upErr.message ?? 'Could not update business profile') };
    }
  } else {
    let lastError = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const public_id = generatePublicId();
      const { data: inserted, error: insErr } = await supabase
        .from('business_profiles')
        .insert({
          profile_id: userId,
          public_id,
          business_name: name,
          business_type: type,
          business_slug: null,
        })
        .select('id')
        .single();

      if (!insErr && inserted?.id) {
        lastError = null;
        break;
      }
      lastError = insErr ?? new Error('Insert did not return a business profile id');
      const code = insErr?.code ?? '';
      if (code === '23505') {
        continue;
      }
      return {
        ok: false,
        error: new Error(insErr?.message ?? 'Could not create business profile'),
      };
    }
    if (lastError) {
      const { data: raced, error: raceReadErr } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle();
      if (raceReadErr || !raced?.id) {
        return {
          ok: false,
          error: new Error(lastError.message ?? 'Could not create business profile'),
        };
      }
      const { error: raceUpErr } = await supabase
        .from('business_profiles')
        .update({
          business_name: name,
          business_type: type,
        })
        .eq('id', raced.id)
        .eq('profile_id', userId);
      if (raceUpErr) {
        return {
          ok: false,
          error: new Error(raceUpErr.message ?? 'Could not update business profile'),
        };
      }
    }
  }

  const read = await readProfileOnboardingStep(userId);
  const nextStep = read.ok ? Math.max(read.step, 2) : 2;
  const { error: profErr } = await supabase
    .from('profiles')
    .update({
      onboarding_status: 'in_progress',
      onboarding_step: nextStep,
    })
    .eq('user_id', userId);

  if (profErr) {
    return {
      ok: false,
      error: new Error(profErr.message ?? 'Could not update onboarding progress'),
    };
  }

  return { ok: true };
}

/**
 * Marks onboarding complete on `profiles` (non-Stripe / dev path until checkout is wired).
 *
 * @param {string} userId
 * @returns {Promise<{ ok: true } | { ok: false; error: Error }>}
 */
async function requireBusinessProfileId(userId) {
  const { data, error } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: new Error(error.message ?? 'Could not load business profile') };
  }
  if (!data?.id) {
    return { ok: false, error: new Error('Complete the business step first.') };
  }
  return { ok: true, businessId: data.id };
}

/**
 * Onboarding step 2: replace all `business_services` for this business, then `profiles.onboarding_step = 3`.
 *
 * @param {{ services: Array<{ name: string; description: string; priceInput?: string; price?: string; durationMinutes: number }> }} input
 * @returns {Promise<{ ok: true; businessId: string } | { ok: false; error: Error }>}
 */
export async function saveOnboardingStep2Services({ services }) {
  const { data: sessWrap } = await getSession();
  const userId = sessWrap?.session?.user?.id;
  if (!userId) {
    return { ok: false, error: new Error('Not signed in') };
  }

  const list = Array.isArray(services) ? services : [];
  if (!list.length) {
    return { ok: false, error: new Error('Add at least one service.') };
  }

  for (const s of list) {
    const name = String(s?.name ?? '').trim();
    const description = String(s?.description ?? '').trim();
    if (!name || !description) {
      return { ok: false, error: new Error('Each service needs a name and description.') };
    }
    const priceRaw = s?.priceInput ?? s?.price ?? '';
    if (!String(priceRaw).trim()) {
      return { ok: false, error: new Error('Each service needs a price.') };
    }
    const durationMinutes = Math.max(30, Number(s?.durationMinutes) || 0);
    if (!Number.isFinite(durationMinutes) || durationMinutes < 30) {
      return { ok: false, error: new Error('Each service needs a duration.') };
    }
  }

  const bp = await requireBusinessProfileId(userId);
  if (!bp.ok) {
    return bp;
  }

  const { error: delErr } = await deleteAllBusinessServicesForBusiness(bp.businessId);
  if (delErr) {
    return {
      ok: false,
      error: new Error(delErr.message ?? 'Could not clear existing services'),
    };
  }

  for (let i = 0; i < list.length; i += 1) {
    const s = list[i];
    const { error: insErr } = await insertBusinessService({
      businessId: bp.businessId,
      name: s.name,
      description: s.description,
      priceInput: s.priceInput ?? s.price,
      durationMinutes: s.durationMinutes,
      sortOrder: i * 10,
    });
    if (insErr) {
      return { ok: false, error: new Error(insErr.message ?? 'Could not save services') };
    }
  }

  const prof = await updateProfileOnboardingStepAtLeast(userId, 3);
  if (!prof.ok) {
    return { ok: false, error: prof.error };
  }

  return { ok: true, businessId: bp.businessId };
}

/**
 * Onboarding step 3: upsert `business_availability` (weekly schedule + preset, accept bookings on),
 * preserve existing minimum notice and time-off blocks when present, then `profiles.onboarding_step = 4`.
 *
 * @param {{ dayEnabledMap: Record<string, boolean>; dayTimeRanges: Record<string, { start?: string; end?: string }>; selectedPreset?: string }} input
 */
export async function saveOnboardingStep3Availability({
  dayEnabledMap,
  dayTimeRanges,
  selectedPreset,
}) {
  const { data: sessWrap } = await getSession();
  const userId = sessWrap?.session?.user?.id;
  if (!userId) {
    return { ok: false, error: new Error('Not signed in') };
  }

  const bp = await requireBusinessProfileId(userId);
  if (!bp.ok) {
    return bp;
  }

  const availRes = await fetchBusinessAvailability(bp.businessId);
  if (availRes.error) {
    return {
      ok: false,
      error: new Error(availRes.error.message ?? 'Could not load availability'),
    };
  }

  const prev = availRes.data;
  const minimumNotice = prev?.minimum_notice ?? 'none';
  const timeOffBlocks = normalizeTimeOffBlocksForSave(prev?.time_off_blocks ?? []);
  const preset = String(selectedPreset ?? 'custom').trim() || 'custom';
  const weeklySchedule = buildWeeklySchedulePayloadFromUi(dayEnabledMap, dayTimeRanges);

  const saveRes = await saveBusinessAvailability({
    businessId: bp.businessId,
    acceptBookings: true,
    selectedPreset: preset,
    weeklySchedule,
    timeOffBlocks,
    minimumNotice,
  });

  if (saveRes.error) {
    return { ok: false, error: new Error(saveRes.error.message ?? 'Could not save availability') };
  }

  const prof = await updateProfileOnboardingStepAtLeast(userId, 4);
  if (!prof.ok) {
    return { ok: false, error: prof.error };
  }

  return { ok: true };
}

/**
 * Onboarding step 4: `business_profiles.business_slug` + `business_link` (e.g. `myservicelink.app/slug`, no `https://`), then `profiles.onboarding_step = 5`.
 *
 * @param {{ slugRaw: string }} input
 */
export async function saveOnboardingStep4Slug({ slugRaw }) {
  const { data: sessWrap } = await getSession();
  const userId = sessWrap?.session?.user?.id;
  if (!userId) {
    return { ok: false, error: new Error('Not signed in') };
  }

  const bp = await requireBusinessProfileId(userId);
  if (!bp.ok) {
    return bp;
  }

  try {
    await updateBusinessSlug({ userId, businessId: bp.businessId, slugRaw });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return { ok: false, error: err };
  }

  const prof = await updateProfileOnboardingStepAtLeast(userId, 5);
  if (!prof.ok) {
    return { ok: false, error: prof.error };
  }

  return { ok: true };
}

export async function markOnboardingCompleted(userId) {
  if (!userId) {
    return { ok: false, error: new Error('Not signed in') };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_status: 'completed',
      onboarding_step: 5,
    })
    .eq('user_id', userId);

  if (error) {
    return { ok: false, error: new Error(error.message ?? 'Could not complete onboarding') };
  }
  return { ok: true };
}
