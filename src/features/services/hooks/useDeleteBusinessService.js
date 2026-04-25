import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { deleteBusinessService } from '../api/services';
import { SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';

export function useDeleteBusinessService({ businessId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ serviceId }) => {
      const { error } = await deleteBusinessService({ businessId, serviceId });
      if (error) throw new Error(error.message ?? 'Could not delete service');
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
    deleteService: mutation.mutateAsync,
    isDeletingService: mutation.isPending,
    deleteServiceVariables: mutation.variables,
    deleteServiceError: mutation.error?.message ?? null,
  };
}
