import { useQuery } from '@tanstack/react-query';
import { fetchMembershipVisitForBooking } from '../api/fetchMembershipVisitForBooking';
import { membershipVisitForBookingQueryKey } from '../queryKeys';
import { useSubscriptionsAccess } from './useSubscriptionsAccess';

/**
 * True when this booking is linked as a membership period / initial visit.
 *
 * @param {{
 *   businessId?: string | null;
 *   bookingId?: string | null;
 * }} args
 */
export function useMembershipVisitForBooking({ businessId, bookingId }) {
  const bid = String(businessId ?? '').trim();
  const id = String(bookingId ?? '').trim();
  const { canUseSubscriptions } = useSubscriptionsAccess();

  const query = useQuery({
    queryKey: membershipVisitForBookingQueryKey(id),
    queryFn: async () => {
      const { linked, membershipId, error } = await fetchMembershipVisitForBooking({
        businessId: bid,
        bookingId: id,
      });
      if (error) {
        throw new Error(error.message ?? 'Could not check membership visit');
      }
      return { linked, membershipId };
    },
    enabled: Boolean(bid && id) && canUseSubscriptions,
    staleTime: 45 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    isMembershipVisit: Boolean(query.data?.linked),
    membershipId: query.data?.membershipId ?? null,
    isPending: query.isPending,
    isError: query.isError,
  };
}
