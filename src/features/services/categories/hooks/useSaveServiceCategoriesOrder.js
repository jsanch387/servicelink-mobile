import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../../home/queryKeys';
import { saveServiceCategoriesSortOrder } from '../api/serviceCategories';
import { SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../../queryKeys';

export function useSaveServiceCategoriesOrder({ businessId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ orderedCategoryIds }) => {
      const { error } = await saveServiceCategoriesSortOrder({
        businessId,
        orderedCategoryIds,
      });
      if (error) throw new Error(error.message ?? 'Could not save category order');
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
      ]);
    },
  });

  return {
    saveCategoriesOrder: mutation.mutateAsync,
    isSavingCategoriesOrder: mutation.isPending,
    saveCategoriesOrderError: mutation.error?.message ?? null,
  };
}
