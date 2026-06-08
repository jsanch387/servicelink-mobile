import { supabase } from '../../../../lib/supabase';

/**
 * Owner catalog: browsing groups for services (Cars, RVs, Boats, …).
 * @param {string} businessId
 * @returns {Promise<{ data: object[] | null; error: object | null }>}
 */
export async function fetchServiceCategories(businessId) {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('business_id', businessId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return { data, error };
}

/**
 * @param {{ businessId: string; name: string; sortOrder?: number | null }} params
 */
export async function insertServiceCategory({ businessId, name, sortOrder = null }) {
  const trimmedName = String(name ?? '').trim();
  const row = {
    business_id: businessId,
    name: trimmedName,
  };
  if (Number.isFinite(sortOrder)) {
    row.sort_order = sortOrder;
  }

  const { data, error } = await supabase.from('service_categories').insert(row).select('*');
  return { data: data?.[0] ?? null, error };
}

/**
 * @param {{ businessId: string; categoryId: string; name: string }} params
 */
export async function updateServiceCategory({ businessId, categoryId, name }) {
  const { data, error } = await supabase
    .from('service_categories')
    .update({
      name: String(name ?? '').trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .eq('business_id', businessId)
    .select('*');

  return { data: data?.[0] ?? null, error };
}

/**
 * Services keep their rows; DB `ON DELETE SET NULL` clears `category_id`.
 * @param {{ businessId: string; categoryId: string }} params
 */
export async function deleteServiceCategory({ businessId, categoryId }) {
  const { error } = await supabase
    .from('service_categories')
    .delete()
    .eq('id', categoryId)
    .eq('business_id', businessId);

  return { error };
}

/**
 * Persists category tab / booking-link section order for a business.
 * @param {{ businessId: string; orderedCategoryIds: string[] }} params
 */
export async function saveServiceCategoriesSortOrder({ businessId, orderedCategoryIds }) {
  const ids = orderedCategoryIds ?? [];
  if (!ids.length) return { error: null };

  const updatedAt = new Date().toISOString();

  for (let index = 0; index < ids.length; index += 1) {
    const categoryId = ids[index];
    const { error } = await supabase
      .from('service_categories')
      .update({
        sort_order: index * 10,
        updated_at: updatedAt,
      })
      .eq('id', categoryId)
      .eq('business_id', businessId);
    if (error) return { error };
  }

  return { error: null };
}
