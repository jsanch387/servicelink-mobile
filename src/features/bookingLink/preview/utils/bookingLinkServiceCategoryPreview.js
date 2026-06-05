import {
  shouldShowCategoryTabs,
  UNCATEGORIZED_TAB_LABEL,
} from '../../../services/categories/constants/categoryCatalogUi';
import { UNCATEGORIZED_SERVICES_GROUP_ID } from '../../../services/categories/constants/categoryIds';
import { BOOKING_LINK_ALL_CATEGORY_ID } from '../../constants/bookingLinkServiceCategories';

function serviceCategoryByIdFromServices(services) {
  const map = {};
  for (const service of services ?? []) {
    const serviceId = String(service?.id ?? '');
    const categoryId = service?.categoryId;
    if (!serviceId || !categoryId) continue;
    map[serviceId] = String(categoryId);
  }
  return map;
}

/**
 * Same visibility rules as the owner Services list — hide filters when grouping adds no value.
 * @param {{ id: string; name: string }[]} categories
 * @param {Array<{ id: string; categoryId?: string | null }>} services
 */
export function shouldShowBookingLinkCategoryFilters(categories, services) {
  const list = categories ?? [];
  if (list.length === 0) return false;

  return shouldShowCategoryTabs({
    categories: list,
    services: services ?? [],
    serviceCategoryById: serviceCategoryByIdFromServices(services),
  });
}

/**
 * @param {{ id: string; name: string }[]} categories
 * @param {Array<{ categoryId?: string | null }>} services
 */
export function buildBookingLinkCategoryFilterTabs(categories, services) {
  const categoryList = categories ?? [];
  if (!shouldShowBookingLinkCategoryFilters(categoryList, services)) return null;

  const tabs = categoryList.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const uncategorizedCount = (services ?? []).filter((service) => !service.categoryId).length;
  if (uncategorizedCount > 0) {
    tabs.push({
      id: UNCATEGORIZED_SERVICES_GROUP_ID,
      name: UNCATEGORIZED_TAB_LABEL,
    });
  }

  return [{ id: BOOKING_LINK_ALL_CATEGORY_ID, name: 'All' }, ...tabs];
}

/**
 * @param {Array<{ categoryId?: string | null }>} services
 * @param {string} selectedTabId
 */
export function filterBookingLinkServicesByCategory(services, selectedTabId) {
  if (!selectedTabId || selectedTabId === BOOKING_LINK_ALL_CATEGORY_ID) {
    return services ?? [];
  }
  if (selectedTabId === UNCATEGORIZED_SERVICES_GROUP_ID) {
    return (services ?? []).filter((service) => !service.categoryId);
  }
  return (services ?? []).filter((service) => service.categoryId === selectedTabId);
}
