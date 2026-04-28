import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveOwnerBookingLink } from '../api/saveOwnerBookingLink';
import { BOOKING_LINK_QUERY_KEY } from '../queryKeys';

/**
 * Persists booking-link text fields and optional cover/logo replacements.
 * Invalidates booking-link queries on success so preview stays in sync.
 */
export function useSaveBookingLinkText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveOwnerBookingLink,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BOOKING_LINK_QUERY_KEY });
    },
  });
}
