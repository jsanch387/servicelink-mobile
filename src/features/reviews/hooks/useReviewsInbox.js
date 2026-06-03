import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchReviewsForBusiness } from '../api/reviews';
import { REVIEWS_QUERY_ROOT, reviewsListQueryKey } from '../queryKeys';
import { buildReviewsSummary } from '../utils/buildReviewsSummary';
import { mapReviewRowToModel } from '../utils/reviewModel';

export function useReviewsInbox() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  useFocusEffect(
    useCallback(() => {
      void queryClient.refetchQueries({
        queryKey: REVIEWS_QUERY_ROOT,
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
    queryKey: reviewsListQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchReviewsForBusiness(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load reviews');
      }
      return (data ?? []).map(mapReviewRowToModel);
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const reviews = listQ.data ?? [];
  const summary = useMemo(() => buildReviewsSummary(reviews), [reviews]);

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const listError = listQ.isError ? (listQ.error?.message ?? 'Could not load reviews') : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingList = hasBusinessRow && listQ.isPending;
  const isLoading = isPendingBusiness || isPendingList;
  const isFetching = businessQ.isFetching || listQ.isFetching;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: REVIEWS_QUERY_ROOT });
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
    reviews,
    summary,
    isLoading,
    isFetching,
    refetch,
  };
}
