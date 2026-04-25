import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { deleteServiceAddon } from '../api/services';
import { serviceEditorQueryKey, SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';

export function useDeleteServiceAddon({ businessId, userId, serviceId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ addonId }) => {
      const { error } = await deleteServiceAddon({ businessId, addonId });
      if (error) throw new Error(error.message ?? 'Could not delete add-on');
    },
    onSuccess: async () => {
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
      ];
      if (serviceId) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: serviceEditorQueryKey(businessId, serviceId) }),
        );
      }
      await Promise.all(invalidations);
    },
  });

  return {
    deleteAddon: mutation.mutateAsync,
    isDeletingAddon: mutation.isPending,
    deleteAddonError: mutation.error?.message ?? null,
  };
}
