import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveBusinessAvailability } from '../api/availability';
import { AVAILABILITY_QUERY_ROOT, businessAvailabilityQueryKey } from '../queryKeys';

export function useSaveBusinessAvailability({ businessId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await saveBusinessAvailability({
        businessId,
        ...payload,
      });
      if (error) {
        throw new Error(error.message ?? 'Could not save availability');
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_ROOT });
      await queryClient.invalidateQueries({ queryKey: businessAvailabilityQueryKey(businessId) });
    },
  });

  return {
    saveAvailability: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error?.message ?? '',
  };
}
