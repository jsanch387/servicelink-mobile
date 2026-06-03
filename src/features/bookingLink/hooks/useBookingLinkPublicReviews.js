import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchPublicReviewsForBusiness } from '../../reviews/api/reviews';
import { mapReviewRowToModel } from '../../reviews/utils/reviewModel';
import { buildReviewsSummary } from '../../reviews/utils/buildReviewsSummary';
import { bookingLinkPublicReviewsQueryKey } from '../queryKeys';

/**
 * Public reviews for the booking-link preview (header rating + Reviews tab).
 *
 * @param {string | null | undefined} businessId
 * @param {boolean} enabled
 */
export function useBookingLinkPublicReviews(businessId, enabled) {
  const listQ = useQuery({
    queryKey: bookingLinkPublicReviewsQueryKey(businessId),
    queryFn: async () => {
      const { data, error } = await fetchPublicReviewsForBusiness(businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not load reviews');
      }
      return (data ?? []).map(mapReviewRowToModel);
    },
    enabled: Boolean(businessId) && enabled,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const reviews = listQ.data ?? [];
  const summary = useMemo(() => buildReviewsSummary(reviews), [reviews]);

  return {
    reviews,
    summary,
    isLoading: listQ.isPending,
    isFetching: listQ.isFetching,
    error: listQ.isError ? (listQ.error?.message ?? 'Could not load reviews') : null,
    refetch: listQ.refetch,
  };
}
