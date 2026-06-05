import { UNCATEGORIZED_SERVICES_GROUP_ID } from './categoryIds';

/** Owner-facing label for services with no category (tab pill + empty states). */
export const UNCATEGORIZED_TAB_LABEL = 'No category';

/** Prepended to category pickers so assignment stays optional. */
export const UNCATEGORIZED_CATEGORY_OPTION = {
  value: '',
  label: 'None',
};

/**
 * Show horizontal category tabs only when grouping is useful:
 * - 0 categories → flat list
 * - 1 category and every service is in it → flat list (tabs would be redundant)
 * - 1 category + unassigned services → tabs (e.g. Cars | No category)
 * - 2+ categories → tabs
 */
export function shouldShowCategoryTabs({ categories, services, serviceCategoryById }) {
  const list = categories ?? [];
  if (list.length === 0) return false;
  if (list.length >= 2) return true;

  const uncategorizedCount = (services ?? []).filter(
    (service) => !serviceCategoryById?.[service.id],
  ).length;
  return uncategorizedCount > 0;
}

export function isUncategorizedTabId(tabId) {
  return tabId === UNCATEGORIZED_SERVICES_GROUP_ID;
}
