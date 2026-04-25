import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { saveServiceEditorChanges } from '../api/services';
import { serviceEditorQueryKey, SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';

export function useSaveServiceEdits({ businessId, serviceId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const { error } = await saveServiceEditorChanges({
        businessId,
        serviceId,
        ...payload,
      });
      if (error) throw new Error(error.message ?? 'Could not save service changes');
      return true;
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
    saveChanges: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error?.message ?? null,
  };
}
