import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { getSession, useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchOwnerReviewPage } from '../api/fetchOwnerReviewFeed';
import { fetchReviewsForBusiness } from '../api/reviews';
import { EMPTY_REVIEWS_LIST, REVIEWS_EMPTY_SUMMARY } from '../constants';
import { REVIEWS_INBOX_PAGE_SIZE } from '../constants/reviewsApiRoutes';
import { REVIEWS_QUERY_ROOT, reviewsListQueryKey } from '../queryKeys';
import { buildReviewsSummary } from '../utils/buildReviewsSummary';
import { mapDashboardReviewToModel, mapReviewRowToModel } from '../utils/reviewModel';

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(/** @type {string | null} */ (null));

  const listQ = useQuery({
    queryKey: reviewsListQueryKey(businessId),
    queryFn: async () => {
      const { data: sessionData } = await getSession();
      const feed = await fetchOwnerReviewPage(sessionData?.session?.access_token, 0);
      if (feed.ok) {
        return {
          mode: /** @type {'api'} */ ('api'),
          reviews: feed.reviews.map(mapDashboardReviewToModel),
          summary: feed.summary,
          hasMore: feed.hasMore,
          nextOffset: REVIEWS_INBOX_PAGE_SIZE,
        };
      }

      // The list route still rejects Bearer until the server accepts it.
      if (feed.httpStatus === 401) {
        const { data, error, hasMore } = await fetchReviewsForBusiness(businessId, 0);
        if (error) {
          throw new Error(error.message ?? 'Could not load reviews');
        }
        const reviews = (data ?? []).map(mapReviewRowToModel);
        return {
          mode: /** @type {'supabase'} */ ('supabase'),
          reviews,
          summary: buildReviewsSummary(reviews),
          hasMore,
          nextOffset: REVIEWS_INBOX_PAGE_SIZE,
        };
      }

      throw new Error(feed.userMessage);
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const reviews = listQ.data?.reviews ?? EMPTY_REVIEWS_LIST;
  const summary = listQ.data?.summary ?? REVIEWS_EMPTY_SUMMARY;
  const hasMore = listQ.data?.hasMore === true;

  const loadMore = useCallback(async () => {
    const current = queryClient.getQueryData(reviewsListQueryKey(businessId));
    if (!current?.hasMore || isLoadingMore || !businessId) return;

    setLoadMoreError(null);
    setIsLoadingMore(true);
    try {
      if (current.mode === 'api') {
        const { data: sessionData } = await getSession();
        const page = await fetchOwnerReviewPage(
          sessionData?.session?.access_token,
          current.nextOffset,
        );
        if (!page.ok) {
          setLoadMoreError(page.userMessage);
          return;
        }
        const seen = new Set(current.reviews.map((review) => review.id));
        const nextReviews = page.reviews
          .map(mapDashboardReviewToModel)
          .filter((review) => !seen.has(review.id));
        queryClient.setQueryData(reviewsListQueryKey(businessId), {
          ...current,
          reviews: [...current.reviews, ...nextReviews],
          hasMore: page.hasMore,
          nextOffset: current.nextOffset + REVIEWS_INBOX_PAGE_SIZE,
        });
        return;
      }

      const page = await fetchReviewsForBusiness(businessId, current.nextOffset);
      if (page.error) {
        setLoadMoreError(page.error.message ?? 'Could not load reviews');
        return;
      }
      const seen = new Set(current.reviews.map((review) => review.id));
      const nextReviews = (page.data ?? [])
        .map(mapReviewRowToModel)
        .filter((review) => !seen.has(review.id));
      queryClient.setQueryData(reviewsListQueryKey(businessId), {
        ...current,
        reviews: [...current.reviews, ...nextReviews],
        summary: buildReviewsSummary([...current.reviews, ...nextReviews]),
        hasMore: page.hasMore,
        nextOffset: current.nextOffset + REVIEWS_INBOX_PAGE_SIZE,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [businessId, isLoadingMore, queryClient]);

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
    loadMoreError,
    reviews,
    summary,
    hasMore,
    isLoading,
    isLoadingMore,
    isFetching,
    loadMore,
    refetch,
  };
}
