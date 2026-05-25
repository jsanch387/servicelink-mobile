/** @type {const} */
export const MAINTENANCE_QUERY_ROOT = ['maintenance'];

export function maintenanceListQueryKey(businessId) {
  return [...MAINTENANCE_QUERY_ROOT, 'list', businessId ?? 'none'];
}

export function maintenanceDetailQueryKey(businessId, customerId, enrollmentId) {
  return [
    ...MAINTENANCE_QUERY_ROOT,
    'detail',
    businessId ?? 'none',
    customerId ?? 'none',
    enrollmentId ?? 'none',
  ];
}
