import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceDurationHHmmToMinutes } from '../../../components/ui/durationTime';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { insertServiceAddon, updateServiceAddon } from '../api/services';
import { serviceEditorQueryKey, SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';
import { mapServiceAddonRowToEditorOption } from '../utils/serviceAddonModel';

export function useMutateServiceAddon({ businessId, userId, serviceId }) {
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
    mutateAddon: mutation.mutateAsync,
    isSavingAddon: mutation.isPending,
    mutateAddonError: mutation.error?.message ?? null,
  };
}
