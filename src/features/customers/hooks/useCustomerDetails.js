import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { buildCustomerDetailsFromApi } from '../customer-details/utils/buildCustomerDetailsFromApi';
import { fetchBookingsForCustomerMetrics, fetchCustomerForBusiness } from '../api/customers';
import { customerDetailsQueryKey } from '../queryKeys';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';

function sanitizeCustomerId(customerId) {
  if (customerId == null) {
    return null;
  }
  const id = String(customerId).trim();
  return id.length > 0 ? id : null;
}

/**
 * Loads one customer row + their booking metrics for the detail screen.
 * @param {string | undefined} customerId from navigation params
 */
export function useCustomerDetails(customerId) {
  const { user, isReady } = useAuth();
  const userId = user?.id;
  const sanitizedId = sanitizeCustomerId(customerId);
  const invalidId = Boolean(userId) && !sanitizedId;

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
    gcTime: 15 * 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;
  const hasBusinessRow = Boolean(businessId);

  const detailQ = useQuery({
    queryKey: customerDetailsQueryKey(businessId, sanitizedId),
    queryFn: async () => {
      const [{ data: customer, error: customerError }, { data: bookings, error: bookingsError }] =
        await Promise.all([
          fetchCustomerForBusiness(businessId, sanitizedId),
          fetchBookingsForCustomerMetrics(businessId, sanitizedId),
        ]);
      const err = customerError ?? bookingsError;
      if (err) {
        throw new Error(err.message ?? 'Could not load customer');
      }
      if (!customer) {
        return { model: null, notFound: true };
      }
      const model = buildCustomerDetailsFromApi(customer, bookings ?? [], Date.now());
      return { model, notFound: false };
    },
    enabled: Boolean(userId) && hasBusinessRow && Boolean(sanitizedId),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const detailError = detailQ.isError
    ? (detailQ.error?.message ?? 'Could not load customer')
    : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingDetail = hasBusinessRow && Boolean(sanitizedId) && detailQ.isPending;
  const isLoading = !isReady || isPendingBusiness || isPendingDetail;

  const payload = detailQ.data;
  const notFound = Boolean(payload?.notFound);
  const model = payload?.model ?? null;

  const refetch = useCallback(async () => {
    await Promise.all([businessQ.refetch(), detailQ.refetch()]);
  }, [businessQ, detailQ]);

  const isFetching = businessQ.isFetching || detailQ.isFetching;

  return {
    businessId,
    businessError,
    customerId: sanitizedId,
    detailError,
    invalidId,
    isLoading,
    isFetching,
    model,
    notFound,
    refetch,
  };
}
