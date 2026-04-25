import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { updateBusinessServiceActive } from '../api/services';
import { serviceEditorQueryKey, SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';

export function useUpdateBusinessServiceActive({ businessId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ serviceId, isActive }) => {
      const { error } = await updateBusinessServiceActive({ businessId, serviceId, isActive });
      if (error) throw new Error(error.message ?? 'Could not update service');
    },
    onSuccess: async (_data, { serviceId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: serviceEditorQueryKey(businessId, serviceId) }),
        queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
      ]);
    },
    onError: async () => {
      await queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) });
    },
  });

  return {
    setServiceActive: mutation.mutateAsync,
    isTogglingServiceActive: mutation.isPending,
    toggleServiceVariables: mutation.variables,
    toggleServiceError: mutation.error?.message ?? null,
  };
}
