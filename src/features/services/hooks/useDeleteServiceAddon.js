import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { deleteServiceAddon } from '../api/services';
import {
  SERVICES_QUERY_ROOT,
  serviceEditorAllServicesQueryKey,
  servicesCatalogQueryKey,
} from '../queryKeys';

function stripDeletedAddonFromCachedEditorModel(old, addonId) {
  if (!old || typeof old !== 'object') return old;
  const idStr = String(addonId ?? '');
  const prevAddons = old.addonOptions ?? [];
  const prevSelected = old.selectedAddonIds ?? [];
  const addonOptions = prevAddons.filter((a) => String(a?.id ?? '') !== idStr);
  const selectedAddonIds = prevSelected.filter((id) => String(id ?? '') !== idStr);
  if (
    addonOptions.length === prevAddons.length &&
    selectedAddonIds.length === prevSelected.length
  ) {
    return old;
  }
  return { ...old, addonOptions, selectedAddonIds };
}

export function useDeleteServiceAddon({ businessId, userId, serviceId: _serviceId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ addonId }) => {
      const { error } = await deleteServiceAddon({ businessId, addonId });
      if (error) throw new Error(error.message ?? 'Could not delete add-on');
    },
    onSuccess: async (_data, variables) => {
      const addonId = variables?.addonId;
      if (businessId != null && addonId != null) {
        queryClient.setQueriesData(
          { queryKey: serviceEditorAllServicesQueryKey(businessId) },
          (old) => stripDeletedAddonFromCachedEditorModel(old, addonId),
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
        queryClient.invalidateQueries({ queryKey: serviceEditorAllServicesQueryKey(businessId) }),
      ]);
    },
  });

  return {
    deleteAddon: mutation.mutateAsync,
    isDeletingAddon: mutation.isPending,
    deleteAddonError: mutation.error?.message ?? null,
  };
}
