import { UNCATEGORIZED_TAB_LABEL } from '../constants/categoryCatalogUi';
import { UNCATEGORIZED_SERVICES_GROUP_ID } from '../constants/categoryIds';

export { UNCATEGORIZED_SERVICES_GROUP_ID };

function formatServiceCount(count) {
  return `${count} ${count === 1 ? 'service' : 'services'}`;
}

/**
 * @param {unknown[]} services
 * @param {Record<string, string | undefined>} serviceCategoryById
 * @param {string} categoryId
 */
export function countServicesAssignedToCategory(services, serviceCategoryById, categoryId) {
  const id = String(categoryId ?? '');
  if (!id) return 0;
  return (services ?? []).filter((service) => serviceCategoryById?.[service.id] === id).length;
}

/**
 * @param {{
 *   services: { id: string }[];
 *   categories: { id: string; name: string }[];
 *   serviceCategoryById: Record<string, string | undefined>;
 * }} params
 * @returns {{ id: string; name: string; services: unknown[]; servicesCountLabel: string }[] | null}
 */
export function groupServicesByCategory({ services, categories, serviceCategoryById }) {
  if (!categories?.length || !services?.length) return null;

  const groups = categories
    .map((category) => {
      const matched = services.filter((service) => serviceCategoryById[service.id] === category.id);
      return {
        id: category.id,
        name: category.name,
        services: matched,
        servicesCountLabel: formatServiceCount(matched.length),
      };
    })
    .filter((group) => group.services.length > 0);

  const uncategorized = services.filter((service) => !serviceCategoryById[service.id]);
  if (uncategorized.length > 0) {
    groups.push({
      id: UNCATEGORIZED_SERVICES_GROUP_ID,
      name: UNCATEGORIZED_TAB_LABEL,
      services: uncategorized,
      servicesCountLabel: formatServiceCount(uncategorized.length),
    });
  }

  return groups.length > 0 ? groups : null;
}

export function withCategoryServiceCounts(categories, services, serviceCategoryById) {
  return (categories ?? []).map((category) => {
    const assignedServiceCount = countServicesAssignedToCategory(
      services,
      serviceCategoryById,
      category.id,
    );
    return {
      ...category,
      assignedServiceCount,
      servicesCountLabel: formatServiceCount(assignedServiceCount),
    };
  });
}

/**
 * @returns {{ id: string; name: string; count: number; services: unknown[] }[] | null}
 */
export function buildServiceCategoryTabs({ services, categories, serviceCategoryById }) {
  if (!categories?.length) return null;

  const tabs = categories.map((category) => {
    const matched = (services ?? []).filter(
      (service) => serviceCategoryById[service.id] === category.id,
    );
    return {
      id: category.id,
      name: category.name,
      count: matched.length,
      services: matched,
    };
  });

  const uncategorized = (services ?? []).filter((service) => !serviceCategoryById[service.id]);
  if (uncategorized.length > 0) {
    tabs.push({
      id: UNCATEGORIZED_SERVICES_GROUP_ID,
      name: UNCATEGORIZED_TAB_LABEL,
      count: uncategorized.length,
      services: uncategorized,
    });
  }

  return tabs;
}
