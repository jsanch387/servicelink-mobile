import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePaymentSettingsRow } from '../api/savePaymentSettings';
import { PAYMENTS_QUERY_ROOT } from '../queryKeys';

/**
 * @param {{ businessId: string | null }} args
 */
export function useSavePaymentSettings({ businessId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload) => {
      if (!businessId) {
        throw new Error('Missing business');
      }
      const { data, error } = await updatePaymentSettingsRow({
        businessId,
        ...payload,
      });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_ROOT });
    },
  });

  return {
    savePaymentSettings: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error?.message ?? '',
    resetSaveError: mutation.reset,
  };
}
