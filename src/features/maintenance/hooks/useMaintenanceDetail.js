import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { getWebAppOrigin } from '../../../lib/webAppOrigin';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchMaintenanceEnrollmentById } from '../api/fetchMaintenanceEnrollmentsSupabase';
import { mapMaintenanceFetchError } from '../api/mapMaintenanceFetchError';
import { maintenanceDetailQueryKey } from '../queryKeys';
import { mapMaintenanceDetailModel } from '../utils/maintenancePresentation';

/**
 * @param {string | undefined} customerId
 * @param {string | undefined} enrollmentId
 */
export function useMaintenanceDetail(customerId, enrollmentId) {
  const { user } = useAuth();
  const userId = user?.id;
  const sanitizedCustomerId = customerId == null ? null : String(customerId).trim() || null;
  const sanitizedEnrollmentId = enrollmentId == null ? null : String(enrollmentId).trim() || null;

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      if (!data?.id) {
        throw new Error('Your business profile is not set up yet.');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;

  const detailQ = useQuery({
    queryKey: maintenanceDetailQueryKey(businessId, sanitizedCustomerId, sanitizedEnrollmentId),
    queryFn: async () => {
      const { customer, error } = await fetchMaintenanceEnrollmentById(
        businessId,
        sanitizedCustomerId,
        sanitizedEnrollmentId,
      );
      if (error) {
        throw new Error(mapMaintenanceFetchError(error));
      }
      if (!customer?.maintenanceEnrollment) {
        return { model: null, notFound: true };
      }
      const siteOrigin = getWebAppOrigin() ?? '';
      const model = mapMaintenanceDetailModel(customer, siteOrigin);
      return { model, notFound: false };
    },
    enabled: Boolean(businessId) && Boolean(sanitizedCustomerId) && Boolean(sanitizedEnrollmentId),
    staleTime: 45 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const detailError = detailQ.isError
    ? (detailQ.error?.message ?? 'Could not load maintenance detail')
    : null;

  const isLoading =
    businessQ.isPending ||
    (Boolean(businessId) && Boolean(sanitizedCustomerId) && detailQ.isPending);

  const payload = detailQ.data;
  const notFound = Boolean(payload?.notFound);
  const model = payload?.model ?? null;

  const refetch = async () => {
    await Promise.all([businessQ.refetch(), detailQ.refetch()]);
  };

  return {
    businessId,
    businessError,
    detailError,
    isFetching: businessQ.isFetching || detailQ.isFetching,
    isLoading,
    model,
    notFound,
    refetch,
  };
}
