import { UNCATEGORIZED_CATEGORY_OPTION } from '../constants/categoryCatalogUi';

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null) {
      return row[key];
    }
  }
  return null;
}

function sortCategories(a, b) {
  const orderA = numberOrNull(a.sortOrder);
  const orderB = numberOrNull(b.sortOrder);
  if (orderA != null && orderB != null && orderA !== orderB) {
    return orderA - orderB;
  }
  if (orderA != null && orderB == null) return -1;
  if (orderA == null && orderB != null) return 1;

  const createdA = Date.parse(a.createdAt ?? '') || 0;
  const createdB = Date.parse(b.createdAt ?? '') || 0;
  if (createdA !== createdB) {
    return createdA - createdB;
  }
  return String(a.name).localeCompare(String(b.name));
}

/**
 * @param {object[] | null | undefined} rows Raw `service_categories` rows.
 */
export function buildServiceCategoriesFromRows(rows) {
  return (rows ?? [])
    .map((row) => {
      const id = String(pick(row, ['id']) ?? '');
      const name = String(pick(row, ['name']) ?? '').trim();
      if (!id || !name) return null;

      const sortOrder = pick(row, ['sort_order', 'sortOrder']);
      const createdAt = pick(row, ['created_at', 'createdAt']);

      return {
        id,
        name,
        sortOrder: numberOrNull(sortOrder),
        createdAt: typeof createdAt === 'string' ? createdAt : null,
      };
    })
    .filter(Boolean)
    .sort(sortCategories);
}

/**
 * Build `{ [serviceId]: categoryId }` from raw `business_services` rows.
 * @param {object[] | null | undefined} serviceRows
 * @returns {Record<string, string>}
 */
export function buildServiceCategoryByIdFromServiceRows(serviceRows) {
  const map = {};
  for (const row of serviceRows ?? []) {
    const serviceId = pick(row, ['id']);
    const categoryId = pick(row, ['category_id', 'categoryId']);
    if (!serviceId || !categoryId) continue;
    map[String(serviceId)] = String(categoryId);
  }
  return map;
}

/**
 * @param {{ id: string; name: string }[]} categories
 */
export function buildCategorySelectOptions(categories) {
  return (categories ?? []).map((category) => ({
    value: category.id,
    label: category.name,
  }));
}

/**
 * @param {{ id: string; name: string }[]} categories
 */
export function buildCategorySelectOptionsWithNone(categories) {
  return [UNCATEGORIZED_CATEGORY_OPTION, ...buildCategorySelectOptions(categories)];
}
