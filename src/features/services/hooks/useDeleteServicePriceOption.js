import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { deleteServicePriceOption } from '../api/services';
import { serviceEditorQueryKey, SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';
import { isUnsavedPricingOptionId } from '../utils/pricingOptionIds';

export function useDeleteServicePriceOption({ businessId, serviceId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ optionId }) => {
      if (isUnsavedPricingOptionId(optionId)) {
        return { skippedRemote: true };
      }
      const { error } = await deleteServicePriceOption({ businessId, serviceId, optionId });
      if (error) throw new Error(error.message ?? 'Could not delete pricing option');
      return { skippedRemote: false };
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: serviceEditorQueryKey(businessId, serviceId) }),
        queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
      ]);
    },
  });

  return {
    deletePricingOption: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error?.message ?? null,
  };
}
