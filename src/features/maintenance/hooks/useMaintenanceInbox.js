import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchLatestMaintenanceEnrollmentsByBusiness } from '../api/fetchMaintenanceEnrollmentsSupabase';
import { mapMaintenanceFetchError } from '../api/mapMaintenanceFetchError';
import { MAINTENANCE_QUERY_ROOT, maintenanceListQueryKey } from '../queryKeys';
import {
  mapMaintenanceEnrollmentCard,
  partitionMaintenanceInbox,
} from '../utils/maintenancePresentation';

export function useMaintenanceInbox() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: MAINTENANCE_QUERY_ROOT,
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
    queryKey: maintenanceListQueryKey(businessId),
    queryFn: async () => {
      const { customers, error } = await fetchLatestMaintenanceEnrollmentsByBusiness(businessId);
      if (error) {
        throw new Error(mapMaintenanceFetchError(error));
      }
      return customers;
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const partitioned = useMemo(() => {
    return partitionMaintenanceInbox(listQ.data ?? []);
  }, [listQ.data]);

  const pendingCards = useMemo(
    () => partitioned.pending.map(mapMaintenanceEnrollmentCard),
    [partitioned.pending],
  );
  const confirmedCards = useMemo(
    () => partitioned.confirmed.map(mapMaintenanceEnrollmentCard),
    [partitioned.confirmed],
  );

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const listError = listQ.isError ? (listQ.error?.message ?? 'Could not load maintenance') : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingList = hasBusinessRow && listQ.isPending;
  const isLoading = isPendingBusiness || isPendingList;
  const isFetching = businessQ.isFetching || listQ.isFetching;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: MAINTENANCE_QUERY_ROOT });
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
    pendingCards,
    confirmedCards,
    isLoading,
    isFetching,
    refetch,
  };
}
