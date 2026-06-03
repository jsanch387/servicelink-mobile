import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateReviewReply } from '../api/reviews';
import { reviewsListQueryKey } from '../queryKeys';
import { mapReviewRowToModel, validateReviewReply } from '../utils/reviewModel';

/**
 * @param {string | null | undefined} businessId
 */
export function useSubmitReviewReply(businessId) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ reviewId, replyText }) => {
      if (!businessId) {
        throw new Error('Could not post reply: missing business.');
      }

      const validation = validateReviewReply(replyText);
      if (!validation.ok) {
        throw new Error(validation.message);
      }

      const { data, error } = await updateReviewReply(businessId, reviewId, validation.value);
      if (error) {
        throw new Error(error.message ?? 'Could not post reply');
      }
      if (!data) {
        throw new Error('Could not post reply');
      }

      return mapReviewRowToModel(data);
    },
    onSuccess: (updatedReview) => {
      queryClient.setQueryData(reviewsListQueryKey(businessId), (current) => {
        if (!Array.isArray(current)) return current;
        return current.map((review) => (review.id === updatedReview.id ? updatedReview : review));
      });
    },
  });

  return mutation;
}
