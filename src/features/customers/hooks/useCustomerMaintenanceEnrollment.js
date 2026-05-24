import { useQuery } from '@tanstack/react-query';
import { fetchLatestMaintenanceEnrollmentForCustomer } from '../../maintenance/api/fetchMaintenanceEnrollmentsSupabase';
import { MAINTENANCE_QUERY_ROOT } from '../../maintenance/queryKeys';

/**
 * Latest maintenance enrollment for one customer (customer detail touchpoint).
 *
 * @param {string | null | undefined} businessId
 * @param {string | null | undefined} customerId
 */
export function useCustomerMaintenanceEnrollment(businessId, customerId) {
  const sanitizedId = customerId == null ? null : String(customerId).trim() || null;

  const query = useQuery({
    queryKey: [...MAINTENANCE_QUERY_ROOT, 'customer', businessId ?? 'none', sanitizedId ?? 'none'],
    queryFn: async () => {
      const { customer, error } = await fetchLatestMaintenanceEnrollmentForCustomer(
        businessId,
        sanitizedId,
      );
      if (error) {
        return {
          maintenanceEnrollment: null,
          maintenanceVisitsCompleted: 0,
        };
      }
      return {
        maintenanceEnrollment: customer?.maintenanceEnrollment ?? null,
        maintenanceVisitsCompleted: customer?.maintenanceVisitsCompleted ?? 0,
      };
    },
    enabled: Boolean(businessId) && Boolean(sanitizedId),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: false,
  });

  return {
    maintenanceEnrollment: query.data?.maintenanceEnrollment ?? null,
    maintenanceVisitsCompleted: query.data?.maintenanceVisitsCompleted ?? 0,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
