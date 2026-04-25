import { useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceDurationHHmmToMinutes } from '../../../components/ui/durationTime';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { insertBusinessService } from '../api/services';
import { SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../queryKeys';

export function useCreateBusinessService({ businessId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ name, description, price, durationHHmm }) => {
      const durationMinutes = serviceDurationHHmmToMinutes(durationHHmm);
      const { data, error } = await insertBusinessService({
        businessId,
        name,
        description,
        priceInput: price,
        durationMinutes,
      });
      if (error) throw new Error(error.message ?? 'Could not create service');
      if (!data) throw new Error('Could not create service');
      return data;
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
    createService: mutation.mutateAsync,
    isCreatingService: mutation.isPending,
    createServiceError: mutation.error?.message ?? null,
  };
}
