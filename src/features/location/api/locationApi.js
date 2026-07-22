import { getSession } from '../../auth/api/auth';
import { supabase } from '../../../lib/supabase';
import {
  assertStripeCheckoutOriginAllowed,
  resolveStripeMobileCheckoutOrigin,
} from '../../../lib/stripeMobileCheckoutOrigin';
import { clearServiceAreaSessionSkip } from '../constants/serviceAreaPrompt';

/**
 * Resolve the owner's business_profiles.id.
 * @param {string} userId
 * @returns {Promise<{ businessProfileId: string | null, error: Error | null }>}
 */
export async function fetchOwnerBusinessProfileId(userId) {
  if (!userId) {
    return { businessProfileId: null, error: new Error('Not signed in') };
  }

  try {
    const { data, error } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) {
      return { businessProfileId: null, error: new Error(error.message) };
    }

    return { businessProfileId: data?.id ?? null, error: null };
  } catch (err) {
    return {
      businessProfileId: null,
      error: err instanceof Error ? err : new Error('Failed to load business profile'),
    };
  }
}

/**
 * Source of truth: primary active row on `business_service_areas`.
 * @param {string} userId
 * @returns {Promise<{
 *   hasConfirmedServiceArea: boolean;
 *   businessProfileId: string | null;
 *   error: Error | null;
 * }>}
 */
export async function checkUserLocationStatus(userId) {
  if (!userId) {
    return {
      hasConfirmedServiceArea: false,
      businessProfileId: null,
      error: new Error('Not signed in'),
    };
  }

  try {
    const { businessProfileId, error: profileError } = await fetchOwnerBusinessProfileId(userId);
    if (profileError) {
      return { hasConfirmedServiceArea: false, businessProfileId: null, error: profileError };
    }
    if (!businessProfileId) {
      return { hasConfirmedServiceArea: false, businessProfileId: null, error: null };
    }

    const { data, error } = await supabase
      .from('business_service_areas')
      .select('id')
      .eq('business_profile_id', businessProfileId)
      .eq('is_primary', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return {
        hasConfirmedServiceArea: false,
        businessProfileId,
        error: new Error(error.message),
      };
    }

    return {
      hasConfirmedServiceArea: Boolean(data?.id),
      businessProfileId,
      error: null,
    };
  } catch (err) {
    return {
      hasConfirmedServiceArea: false,
      businessProfileId: null,
      error: err instanceof Error ? err : new Error('Failed to check service area'),
    };
  }
}

/**
 * Build POST body for `/api/business-profile/service-area`.
 * @param {import('../types/location').StructuredLocation} location
 * @param {number} radiusMiles
 */
export function buildServiceAreaPayload(location, radiusMiles) {
  return {
    label: location.label?.trim() || `${location.city}, ${location.state}`,
    city: location.city.trim(),
    stateCode: location.state.trim().toUpperCase().slice(0, 2),
    postalCode: location.zip?.trim() || null,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMiles,
    placeType: location.placeType || null,
    providerPlaceId: location.providerId || null,
  };
}

/**
 * Prefer the web API so mobile stays in sync with legacy profile columns.
 * @param {{
 *   label: string;
 *   city: string;
 *   stateCode: string;
 *   postalCode?: string | null;
 *   latitude: number;
 *   longitude: number;
 *   radiusMiles: number;
 *   placeType?: string | null;
 *   providerPlaceId?: string | null;
 * }} payload
 * @param {string} [businessProfileId] — used to clear session skip after success
 * @returns {Promise<{ ok: boolean, error: Error | null }>}
 */
export async function saveUserLocation(payload, businessProfileId) {
  if (
    !payload?.city ||
    !payload?.stateCode ||
    !Number.isFinite(payload.latitude) ||
    !Number.isFinite(payload.longitude) ||
    !payload?.radiusMiles
  ) {
    return { ok: false, error: new Error('Invalid location data') };
  }

  const origin = resolveStripeMobileCheckoutOrigin();
  if (!origin) {
    return { ok: false, error: new Error('EXPO_PUBLIC_WEB_APP_URL is not set') };
  }

  try {
    assertStripeCheckoutOriginAllowed(origin);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error('Invalid web origin'),
    };
  }

  const { data: sessionData } = await getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) {
    return { ok: false, error: new Error('Not signed in') };
  }

  let res;
  try {
    res = await fetch(`${origin}/api/business-profile/service-area`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error('Network request failed'),
    };
  }

  let body = {};
  try {
    body = await res.json();
  } catch {
    body = {};
  }

  const serverError =
    typeof body?.error === 'string'
      ? body.error
      : typeof body?.message === 'string'
        ? body.message
        : null;

  if (!res.ok || body?.success === false) {
    return {
      ok: false,
      error: new Error(serverError || `Request failed (${res.status})`),
    };
  }

  if (businessProfileId) {
    clearServiceAreaSessionSkip(businessProfileId);
  }

  return { ok: true, error: null };
}
