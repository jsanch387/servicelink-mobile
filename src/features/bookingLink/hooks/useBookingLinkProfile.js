import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { fetchCompleteOwnerBusinessProfile } from '../api/bookingLink';
import { BOOKING_LINK_QUERY_KEY, bookingLinkOwnerProfileQueryKey } from '../queryKeys';

export function useBookingLinkProfile() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const profileQ = useQuery({
    queryKey: bookingLinkOwnerProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchCompleteOwnerBusinessProfile(userId);
      if (error) throw new Error(error.message ?? 'Could not load booking profile');
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const isLoading = Boolean(userId) && profileQ.isPending;
  const isFetching = profileQ.isFetching;
  const error = profileQ.isError
    ? (profileQ.error?.message ?? 'Could not load booking profile')
    : null;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: BOOKING_LINK_QUERY_KEY });
  }, [queryClient]);

  return {
    profile: profileQ.data ?? null,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
