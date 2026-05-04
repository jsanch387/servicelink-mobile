import { supabase } from '../../../lib/supabase';
import { isUnsavedPricingOptionId } from '../utils/pricingOptionIds';

/**
 * Uses broad selects so mobile can keep working as schema evolves.
 * Mapping layer normalizes snake_case/camelCase variants safely.
 */
export async function fetchBusinessServices(businessId) {
  const { data, error } = await supabase
    .from('business_services')
    .select('*')
    .eq('business_id', businessId);

  return { data, error };
}

export async function deleteBusinessService({ businessId, serviceId }) {
  const { error } = await supabase
    .from('business_services')
    .delete()
    .eq('id', serviceId)
    .eq('business_id', businessId);

  return { error };
}

/** Deletes every service row for the business (used by onboarding “replace all” saves). */
export async function deleteAllBusinessServicesForBusiness(businessId) {
  const { error } = await supabase.from('business_services').delete().eq('business_id', businessId);
  return { error };
}

export async function updateBusinessServiceActive({ businessId, serviceId, isActive }) {
  const { error } = await supabase
    .from('business_services')
    .update({
      is_active: Boolean(isActive),
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .eq('business_id', businessId);

  return { error };
}

export async function insertBusinessService({
  businessId,
  name,
  description,
  priceInput,
  durationMinutes,
  sortOrder,
}) {
  const row = {
    business_id: businessId,
    name: String(name ?? '').trim(),
    description: String(description ?? '').trim(),
    price_cents: centsFromInput(priceInput),
    duration_minutes: Math.max(30, Number(durationMinutes) || 30),
    is_active: true,
  };
  if (Number.isFinite(sortOrder)) {
    row.sort_order = sortOrder;
  }
  const { data, error } = await supabase.from('business_services').insert(row).select('*');
  return { data: data?.[0] ?? null, error };
}

export async function saveBusinessServicesSortOrder({ businessId, orderedServiceIds }) {
  const ids = orderedServiceIds ?? [];
  if (!ids.length) return { error: null };
  const updatedAt = new Date().toISOString();

  for (let index = 0; index < ids.length; index += 1) {
    const serviceId = ids[index];
    const { error } = await supabase
      .from('business_services')
      .update({
        sort_order: index * 10,
        updated_at: updatedAt,
      })
      .eq('id', serviceId)
      .eq('business_id', businessId);
    if (error) return { error };
  }

  return { error: null };
}

export async function fetchServiceAddons(businessId) {
  const { data, error } = await supabase
    .from('service_addons')
    .select('*')
    .eq('business_id', businessId);

  return { data, error };
}

export async function deleteServicePriceOption({ businessId, serviceId, optionId }) {
  const { error } = await supabase
    .from('service_price_options')
    .delete()
    .eq('id', optionId)
    .eq('business_id', businessId)
    .eq('service_id', serviceId);

  return { error };
}

export async function insertServiceAddon({ businessId, name, priceInput, durationMinutes }) {
  const row = {
    business_id: businessId,
    name: String(name ?? '').trim(),
    price_cents: centsFromInput(priceInput),
  };
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    row.duration_minutes = durationMinutes;
  }
  const { data, error } = await supabase.from('service_addons').insert(row).select('*');
  return { data: data?.[0] ?? null, error };
}

export async function updateServiceAddon({
  businessId,
  addonId,
  name,
  priceInput,
  durationMinutes,
}) {
  const patch = {
    name: String(name ?? '').trim(),
    price_cents: centsFromInput(priceInput),
    updated_at: new Date().toISOString(),
  };
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) {
    patch.duration_minutes = durationMinutes;
  } else {
    patch.duration_minutes = null;
  }
  const { data, error } = await supabase
    .from('service_addons')
    .update(patch)
    .eq('id', addonId)
    .eq('business_id', businessId)
    .select('*');

  return { data: data?.[0] ?? null, error };
}

export async function deleteServiceAddon({ businessId, addonId }) {
  const { error } = await supabase
    .from('service_addons')
    .delete()
    .eq('id', addonId)
    .eq('business_id', businessId);

  return { error };
}

export async function fetchServicePriceOptions(businessId) {
  const { data, error } = await supabase
    .from('service_price_options')
    .select('*')
    .eq('business_id', businessId);

  return { data, error };
}

/**
 * Assignments are keyed by `service_id` + `addon_id` only (no `business_id` on the table).
 * Loads all assignments for services belonging to this business.
 */
export async function fetchAddonAssignmentsByService(businessId) {
  const { data: services, error: servicesError } = await supabase
    .from('business_services')
    .select('id')
    .eq('business_id', businessId);
  if (servicesError) return { data: null, error: servicesError };
  const serviceIds = (services ?? []).map((row) => row.id).filter(Boolean);
  if (!serviceIds.length) return { data: [], error: null };

  const { data, error } = await supabase
    .from('service_addon_assignments')
    .select('*')
    .in('service_id', serviceIds);

  return { data, error };
}

export async function fetchAddonAssignmentsForService(serviceId) {
  const { data, error } = await supabase
    .from('service_addon_assignments')
    .select('*')
    .eq('service_id', serviceId);

  return { data, error };
}

function centsFromInput(input) {
  const numeric = Number(String(input ?? '').replace(/[^0-9.]/g, ''));
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.round(numeric * 100);
}

/**
 * `service_price_options` label column name differs by deployment (e.g. `label` vs `name`).
 * PostgREST errors if we send a column that does not exist — infer from a real row when possible.
 * @param {Record<string, unknown> | null | undefined} sampleRow
 * @returns {string}
 */
export function detectPriceOptionLabelColumn(sampleRow) {
  if (!sampleRow || typeof sampleRow !== 'object') return 'label';
  const keys = new Set(Object.keys(sampleRow));
  const priority = [
    'label',
    'option_name',
    'option_label',
    'tier_name',
    'title',
    'display_name',
    'name',
  ];
  for (const k of priority) {
    if (keys.has(k)) return k;
  }
  return 'label';
}

function withPriceOptionLabel(row, labelKey, labelValue) {
  return { ...row, [labelKey]: labelValue };
}

export async function saveServiceEditorChanges({
  businessId,
  serviceId,
  serviceDetails,
  pricingOptions,
  addonOptions: _addonOptions,
  selectedAddonIds,
  priceOptionLabelKey = 'label',
}) {
  const servicePatch = {
    name: serviceDetails.serviceName.trim(),
    description: serviceDetails.description.trim(),
    price_cents: centsFromInput(serviceDetails.price),
    duration_minutes: serviceDetails.durationMinutes,
    updated_at: new Date().toISOString(),
  };

  const { error: serviceUpdateError } = await supabase
    .from('business_services')
    .update(servicePatch)
    .eq('business_id', businessId)
    .eq('id', serviceId);
  if (serviceUpdateError) return { error: serviceUpdateError };

  const resolvedSelectedAddonIds = [...selectedAddonIds].map(String);

  const existingOptions = pricingOptions.filter((option) => !isUnsavedPricingOptionId(option.id));
  const newOptions = pricingOptions.filter((option) => isUnsavedPricingOptionId(option.id));

  if (existingOptions.length) {
    const updateRows = existingOptions.map((option) =>
      withPriceOptionLabel(
        {
          id: option.id,
          business_id: businessId,
          service_id: serviceId,
          price_cents: centsFromInput(option.price),
          duration_minutes: Math.max(1, Number(option.durationMinutes) || 1),
          updated_at: new Date().toISOString(),
        },
        priceOptionLabelKey,
        option.label.trim(),
      ),
    );
    const { error: optionsUpdateError } = await supabase
      .from('service_price_options')
      .upsert(updateRows, { onConflict: 'id' });
    if (optionsUpdateError) return { error: optionsUpdateError };
  }

  if (newOptions.length) {
    const insertRows = newOptions.map((option, index) => {
      const dm = Math.max(1, Number(option.durationMinutes) || 1);
      return withPriceOptionLabel(
        {
          business_id: businessId,
          service_id: serviceId,
          price_cents: centsFromInput(option.price),
          duration_minutes: dm,
          sort_order: (existingOptions.length + index) * 10,
          is_active: true,
        },
        priceOptionLabelKey,
        option.label.trim(),
      );
    });
    const { error: optionsInsertError } = await supabase
      .from('service_price_options')
      .insert(insertRows);
    if (optionsInsertError) return { error: optionsInsertError };
  }

  const { error: assignmentDeleteError } = await supabase
    .from('service_addon_assignments')
    .delete()
    .eq('service_id', serviceId);
  if (assignmentDeleteError) return { error: assignmentDeleteError };

  if (resolvedSelectedAddonIds.length) {
    const assignmentRows = resolvedSelectedAddonIds.map((addonId) => ({
      service_id: serviceId,
      addon_id: addonId,
    }));
    const { error: assignmentInsertError } = await supabase
      .from('service_addon_assignments')
      .insert(assignmentRows);
    if (assignmentInsertError) return { error: assignmentInsertError };
  }

  return { error: null };
}
