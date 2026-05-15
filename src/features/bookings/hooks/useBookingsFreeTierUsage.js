import { useQuery } from '@tanstack/react-query';
import { fetchFreeTierBookingCountForBusiness } from '../api/bookings';
import { FREE_TIER_BOOKINGS_LIMIT } from '../constants';
import { bookingsFreeTierCountQueryKey } from '../queryKeys';
import { shouldRetryBookingsQuery } from '../utils/queryRetryPolicy';

/**
 * Head-count of bookings that count toward the Free-tier cap (see `fetchFreeTierBookingCountForBusiness`).
 *
 * @param {string | null | undefined} businessId
 * @param {{ enabled?: boolean }} [options]
 */
export function useBookingsFreeTierUsage(businessId, options = {}) {
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: bookingsFreeTierCountQueryKey(businessId ?? undefined),
    queryFn: async () => {
      const out = await fetchFreeTierBookingCountForBusiness(businessId);
      if (out.error) {
        throw out.error;
      }
      return out.count;
    },
    enabled: Boolean(businessId) && enabled,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: shouldRetryBookingsQuery,
    retryDelay: 400,
  });

  return {
    used: query.data,
    limit: FREE_TIER_BOOKINGS_LIMIT,
    /** First fetch without usable data yet (TanStack v5 `isLoading`). */
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
