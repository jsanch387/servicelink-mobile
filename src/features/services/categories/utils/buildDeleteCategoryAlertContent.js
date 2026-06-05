import { UNCATEGORIZED_TAB_LABEL } from '../constants/categoryCatalogUi';

/**
 * Copy for the destructive category delete confirmation.
 *
 * @param {{ categoryName?: string; assignedServiceCount?: number }} params
 * @returns {{ title: string; message: string; confirmText: string }}
 */
export function buildDeleteCategoryAlertContent({ categoryName, assignedServiceCount = 0 }) {
  const trimmedName = String(categoryName ?? '').trim();
  const title = trimmedName ? `Delete "${trimmedName}"?` : 'Delete category?';
  const count = Math.max(0, Number(assignedServiceCount) || 0);

  if (count === 0) {
    return {
      title,
      message: 'This category will be removed.',
      confirmText: 'Delete category',
    };
  }

  const assignmentLine =
    count === 1 ? '1 service is in this category.' : `${count} services are in this category.`;

  return {
    title,
    message: `${assignmentLine} They'll stay on your list and appear under ${UNCATEGORIZED_TAB_LABEL}.`,
    confirmText: 'Delete category',
  };
}
