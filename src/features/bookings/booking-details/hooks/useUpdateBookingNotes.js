import { useMutation, useQueryClient } from '@tanstack/react-query';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';
import { updateBookingNotes } from '../api/updateBookingNotes';
import { invalidateBookingCachesAfterMutation } from '../utils/invalidateBookingCachesAfterMutation';
import { patchBookingNotesInDetailsCache } from '../utils/patchBookingNotesInDetailsCache';

/**
 * @param {string | null | undefined} bookingId
 * @param {string | null | undefined} [businessId]
 */
export function useUpdateBookingNotes(bookingId, businessId) {
  const queryClient = useQueryClient();
  const id = String(bookingId ?? '').trim();
  const scopedBusinessId = typeof businessId === 'string' ? businessId.trim() : '';

  const mutation = useMutation({
    mutationFn: async (notes) => {
      const result = await updateBookingNotes(id, notes, scopedBusinessId || undefined);
      if (!result.ok) {
        throw result.error ?? new Error('Could not save notes.');
      }
      return result;
    },
    onSuccess: async (result) => {
      patchBookingNotesInDetailsCache(queryClient, result.bookingId, result.notes);
      await invalidateBookingCachesAfterMutation(queryClient, result.bookingId);
    },
  });

  return {
    saveNotes: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.isError
      ? safeUserFacingMessage(mutation.error, { fallback: 'Could not save notes.' })
      : null,
    resetSaveError: mutation.reset,
  };
}
