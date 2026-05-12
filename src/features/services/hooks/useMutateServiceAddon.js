import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceDurationHHmmToMinutes } from '../../../components/ui/durationTime';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { insertServiceAddon, updateServiceAddon } from '../api/services';
import {
  SERVICES_QUERY_ROOT,
  serviceEditorAllServicesQueryKey,
  servicesCatalogQueryKey,
} from '../queryKeys';
import { mapServiceAddonRowToEditorOption } from '../utils/serviceAddonModel';

function mergeAddonIntoEditorCaches(old, addon) {
  if (!old || typeof old !== 'object' || addon == null) return old;
  const idStr = String(addon.id ?? '');
  if (!idStr) return old;
  const prev = Array.isArray(old.addonOptions) ? old.addonOptions : [];
  const idx = prev.findIndex((a) => String(a?.id ?? '') === idStr);
  const addonOptions = idx >= 0 ? prev.map((a, i) => (i === idx ? addon : a)) : [...prev, addon];
  return { ...old, addonOptions };
}

export function useMutateServiceAddon({ businessId, userId, serviceId: _serviceId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ mode, addonId, name, price, durationHHmm }) => {
      const durationMinutes = durationHHmm ? serviceDurationHHmmToMinutes(durationHHmm) : 0;
      if (mode === 'create') {
        const { data, error } = await insertServiceAddon({
          businessId,
          name,
          priceInput: price,
          durationMinutes,
        });
        if (error) throw new Error(error.message ?? 'Could not create add-on');
        if (!data) throw new Error('Could not create add-on');
        return { addon: mapServiceAddonRowToEditorOption(data) };
      }
      if (!addonId) throw new Error('Missing add-on id');
      const { data, error } = await updateServiceAddon({
        businessId,
        addonId,
        name,
        priceInput: price,
        durationMinutes,
      });
      if (error) throw new Error(error.message ?? 'Could not update add-on');
      if (!data) throw new Error('Could not update add-on');
      return { addon: mapServiceAddonRowToEditorOption(data) };
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
        // Every service editor loads the business add-on catalog — refresh when add-ons change from any screen.
        queryClient.invalidateQueries({ queryKey: serviceEditorAllServicesQueryKey(businessId) }),
      ]);
      if (businessId != null && data?.addon != null) {
        queryClient.setQueriesData(
          { queryKey: serviceEditorAllServicesQueryKey(businessId) },
          (old) => mergeAddonIntoEditorCaches(old, data.addon),
        );
      }
    },
  });

  return {
    mutateAddon: mutation.mutateAsync,
    isSavingAddon: mutation.isPending,
    mutateAddonError: mutation.error?.message ?? null,
  };
}
