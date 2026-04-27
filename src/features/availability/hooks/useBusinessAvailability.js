import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchBusinessAvailability } from '../api/availability';
import { AVAILABILITY_QUERY_ROOT, businessAvailabilityQueryKey } from '../queryKeys';
import {
  buildAvailabilityUiModel,
  buildDefaultAvailabilityUiModel,
} from '../utils/availabilityModel';

export function useBusinessAvailability() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) throw new Error(error.message ?? 'Could not load business');
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;
  const availabilityQ = useQuery({
    queryKey: businessAvailabilityQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessAvailability(businessId);
      if (error) throw new Error(error.message ?? 'Could not load availability');
      return data;
    },
    enabled: Boolean(businessId),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const isLoading =
    (Boolean(userId) && businessQ.isPending) || (Boolean(businessId) && availabilityQ.isPending);
  const isFetching = businessQ.isFetching || availabilityQ.isFetching;
  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const availabilityError = availabilityQ.isError
    ? (availabilityQ.error?.message ?? 'Could not load availability')
    : null;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: AVAILABILITY_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({ queryKey: homeBusinessProfileQueryKey(userId) });
    }
  }, [queryClient, userId]);

  const model = useMemo(
    () =>
      availabilityQ.data
        ? buildAvailabilityUiModel(availabilityQ.data)
        : buildDefaultAvailabilityUiModel(),
    [availabilityQ.data],
  );

  return {
    businessId,
    isLoading,
    isFetching,
    businessError,
    availabilityError,
    refetch,
    row: availabilityQ.data ?? null,
    model,
  };
}
