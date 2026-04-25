import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { saveBusinessServicesSortOrder } from '../api/services';
import { SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';

export function useSaveBusinessServicesOrder({ businessId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ orderedServiceIds }) => {
      const { error } = await saveBusinessServicesSortOrder({
        businessId,
        orderedServiceIds,
      });
      if (error) throw new Error(error.message ?? 'Could not save service order');
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
    saveServicesOrder: mutation.mutateAsync,
    isSavingServicesOrder: mutation.isPending,
    saveServicesOrderError: mutation.error?.message ?? null,
  };
}
