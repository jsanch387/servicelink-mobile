import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertCustomerForBusiness } from '../api/customers';
import { CUSTOMERS_QUERY_ROOT } from '../queryKeys';

/**
 * @param {string | null | undefined} businessId
 */
export function useCreateCustomer(businessId) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ fullName, phone, email, notes }) => {
      if (!businessId) {
        throw new Error('Could not add customer: missing business.');
      }
      const { data, error } = await insertCustomerForBusiness(businessId, {
        fullName,
        phone,
        email,
        notes,
      });
      if (error) throw error;
      if (!data) throw new Error('Could not add customer');
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_ROOT });
    },
  });

  return mutation;
}
