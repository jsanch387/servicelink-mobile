import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteExpense, insertExpenseForBusiness, updateExpense } from '../api/expenses';
import { EXPENSES_QUERY_ROOT } from '../queryKeys';
import { useExpenseBusiness } from './useExpenseBusiness';

export function useExpenseWrites() {
  const { businessId, userId } = useExpenseBusiness();
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_ROOT });
  };

  const save = useMutation({
    mutationFn: async ({ id, name, amount, chargedOn, category }) => {
      if (!businessId) {
        throw new Error('Could not save expense: missing business.');
      }
      const next = { name, amount, chargedOn, category };
      const { data, error } = id
        ? await updateExpense(id, next)
        : await insertExpenseForBusiness(businessId, userId, next);
      if (error) {
        throw new Error(error.message ?? 'Could not save expense');
      }
      return data;
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (expenseId) => {
      const { error } = await deleteExpense(expenseId);
      if (error) {
        throw new Error(error.message ?? 'Could not remove expense');
      }
    },
    onSuccess: invalidate,
  });

  return { save, remove };
}
