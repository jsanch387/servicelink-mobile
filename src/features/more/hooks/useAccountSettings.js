import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { BOOKING_LINK_QUERY_KEY } from '../../bookingLink/queryKeys';
import { HOME_QUERY_KEY } from '../../home/queryKeys';
import { createBillingPortalSession } from '../api/createBillingPortalSession';
import { deleteAccountViaWeb } from '../api/deleteAccount';
import { fetchAccountSettingsBundle } from '../api/fetchAccountSettings';
import { updateBusinessSlug } from '../api/updateBusinessSlug';
import { accountSettingsQueryKey } from '../queryKeys';

export function useAccountSettings() {
  const { user, session } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: accountSettingsQueryKey(userId),
    queryFn: async () => {
      const { ownerProfile, business, error } = await fetchAccountSettingsBundle(userId);
      if (error) throw error;
      return { ownerProfile, business };
    },
    enabled: Boolean(userId),
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async ({ slugRaw }) => {
      if (!userId || !query.data?.business?.id) {
        throw new Error('Missing business profile.');
      }
      await updateBusinessSlug({
        userId,
        businessId: query.data.business.id,
        slugRaw,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: accountSettingsQueryKey(userId) });
      await queryClient.invalidateQueries({ queryKey: HOME_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: BOOKING_LINK_QUERY_KEY });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async ({ confirmEmail }) => {
      const accessToken = session?.access_token ?? '';
      await deleteAccountViaWeb({ accessToken, confirmEmail });
    },
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const accessToken = session?.access_token ?? '';
      return createBillingPortalSession(accessToken);
    },
  });

  const refetch = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    ownerProfile: query.data?.ownerProfile ?? null,
    business: query.data?.business ?? null,
    isLoading: Boolean(userId) && query.isPending,
    isFetching: query.isFetching,
    loadError: query.isError ? (query.error?.message ?? 'Could not load account') : null,
    updateSlug: mutation.mutateAsync,
    isSavingSlug: mutation.isPending,
    saveSlugError: mutation.isError ? (mutation.error?.message ?? 'Could not save') : null,
    resetSaveSlugError: mutation.reset,
    deleteAccount: deleteAccountMutation.mutateAsync,
    isDeletingAccount: deleteAccountMutation.isPending,
    deleteAccountError: deleteAccountMutation.isError
      ? (deleteAccountMutation.error?.message ?? 'Could not delete account')
      : null,
    resetDeleteAccountError: deleteAccountMutation.reset,
    createBillingPortalSession: billingPortalMutation.mutateAsync,
    isCreatingBillingPortalSession: billingPortalMutation.isPending,
    billingPortalError: billingPortalMutation.isError
      ? (billingPortalMutation.error?.message ?? 'Could not open billing portal')
      : null,
    resetBillingPortalError: billingPortalMutation.reset,
    refetch,
  };
}
