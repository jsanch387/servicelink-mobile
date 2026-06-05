import { UNCATEGORIZED_SERVICES_GROUP_ID } from '../constants/categoryIds';

/**
 * @param {{ id: string }[]} services
 * @param {string} tabId
 * @param {Record<string, string | undefined>} serviceCategoryById
 */
export function getServicesForCategoryTab(services, tabId, serviceCategoryById) {
  if (!tabId) return services ?? [];
  if (tabId === UNCATEGORIZED_SERVICES_GROUP_ID) {
    return (services ?? []).filter((service) => !serviceCategoryById?.[service.id]);
  }
  return (services ?? []).filter((service) => serviceCategoryById?.[service.id] === tabId);
}

/**
 * Replaces in-place order of services belonging to the active tab; other services unchanged.
 *
 * @param {{ id: string }[]} fullServices
 * @param {string[]} tabServiceIds
 * @param {{ id: string }[]} reorderedTabServices
 */
export function mergeServicesOrderWithinTab(fullServices, tabServiceIds, reorderedTabServices) {
  const tabIdSet = new Set(tabServiceIds);
  let tabIndex = 0;
  return (fullServices ?? []).map((service) => {
    if (!tabIdSet.has(service.id)) return service;
    const next = reorderedTabServices[tabIndex];
    tabIndex += 1;
    return next ?? service;
  });
}

/**
 * @param {{ id: string }[]} catalogServices
 * @param {{ id: string }[]} draftServices
 * @param {string[]} tabServiceIds
 */
export function hasOrderChangesWithinTab(catalogServices, draftServices, tabServiceIds) {
  const tabSet = new Set(tabServiceIds);
  const baseIds = (catalogServices ?? []).filter((s) => tabSet.has(s.id)).map((s) => s.id);
  const draftIds = (draftServices ?? []).filter((s) => tabSet.has(s.id)).map((s) => s.id);
  if (baseIds.length !== draftIds.length) return true;
  for (let i = 0; i < baseIds.length; i += 1) {
    if (baseIds[i] !== draftIds[i]) return true;
  }
  return false;
}
