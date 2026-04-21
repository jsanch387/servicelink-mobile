import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  buildCustomerCards,
  fetchCustomerBookingsForBusiness,
  fetchCustomersForBusiness,
} from '../api/customers';
import { CUSTOMERS_QUERY_ROOT, customersListQueryKey } from '../queryKeys';

export function useCustomersList() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: CUSTOMERS_QUERY_ROOT,
        type: 'active',
        stale: true,
      });
    }, [queryClient]),
  );

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const business = businessQ.data ?? null;
  const businessId = business?.id;
  const hasBusinessRow = Boolean(businessId);

  const listQ = useQuery({
    queryKey: customersListQueryKey(businessId),
    queryFn: async () => {
      const [{ data: customers, error: customersError }, { data: bookings, error: bookingsError }] =
        await Promise.all([
          fetchCustomersForBusiness(businessId),
          fetchCustomerBookingsForBusiness(businessId),
        ]);

      const error = customersError ?? bookingsError;
      if (error) {
        throw new Error(error.message ?? 'Could not load customers');
      }

      return buildCustomerCards(customers ?? [], bookings ?? [], Date.now());
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const listError = listQ.isError ? (listQ.error?.message ?? 'Could not load customers') : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingList = hasBusinessRow && listQ.isPending;
  const isLoading = isPendingBusiness || isPendingList;
  const isFetching = businessQ.isFetching || listQ.isFetching;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: CUSTOMERS_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({
        queryKey: homeBusinessProfileQueryKey(userId),
      });
    }
  }, [queryClient, userId]);

  return {
    business,
    businessError,
    listError,
    customers: listQ.data ?? [],
    isPendingBusiness,
    isPendingList,
    isLoading,
    isFetching,
    refetch,
  };
}
