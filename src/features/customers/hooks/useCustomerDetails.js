import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../../auth';
import {
  findMockSubscriptionForCustomer,
  isMockSubscriptionCustomerId,
} from '../../subscriptions/utils/findMockSubscriptionForCustomer';
import { buildCustomerDetailsFromApi } from '../customer-details/utils/buildCustomerDetailsFromApi';
import { buildMockCustomerDetailsModel } from '../customer-details/utils/buildMockCustomerDetailsModel';
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
 * Mock subscription preview ids (`cust_mock_*`) use local design data.
 * @param {string | undefined} customerId from navigation params
 */
export function useCustomerDetails(customerId) {
  const { user, isReady } = useAuth();
  const route = useRoute();
  const userId = user?.id;
  const sanitizedId = sanitizeCustomerId(customerId);
  const invalidId = Boolean(userId) && !sanitizedId;
  const isMockCustomer = isMockSubscriptionCustomerId(sanitizedId);

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
    enabled: Boolean(userId) && !isMockCustomer,
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessId = isMockCustomer ? 'mock_business' : (businessQ.data?.id ?? null);
  const hasBusinessRow = Boolean(businessId);

  const detailQ = useQuery({
    queryKey: customerDetailsQueryKey(businessId, sanitizedId),
    queryFn: async () => {
      if (isMockCustomer) {
        const sub = findMockSubscriptionForCustomer(sanitizedId);
        const model = buildMockCustomerDetailsModel({
          customerId: sanitizedId,
          customerName: route.params?.customerName || sub?.customerName || undefined,
          customerEmail: route.params?.customerEmail || sub?.customerEmail || undefined,
          customerPhone: route.params?.customerPhone || sub?.customerPhone || undefined,
        });
        return { model, notFound: false };
      }

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
    enabled: Boolean(sanitizedId) && (isMockCustomer || (Boolean(userId) && hasBusinessRow)),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError =
    !isMockCustomer && businessQ.isError
      ? (businessQ.error?.message ?? 'Could not load business')
      : null;
  const detailError = detailQ.isError
    ? (detailQ.error?.message ?? 'Could not load customer')
    : null;

  const isPendingBusiness = Boolean(userId) && !isMockCustomer && businessQ.isPending;
  const isPendingDetail =
    Boolean(sanitizedId) && (isMockCustomer || hasBusinessRow) && detailQ.isPending;
  const isLoading = !isReady || isPendingBusiness || isPendingDetail;

  const payload = detailQ.data;
  const notFound = Boolean(payload?.notFound);
  const model = payload?.model ?? null;

  const refetch = useCallback(async () => {
    if (isMockCustomer) {
      await detailQ.refetch();
      return;
    }
    await Promise.all([businessQ.refetch(), detailQ.refetch()]);
  }, [businessQ, detailQ, isMockCustomer]);

  const isFetching = (!isMockCustomer && businessQ.isFetching) || detailQ.isFetching;

  return {
    businessId: isMockCustomer ? null : businessId,
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
