import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useToast } from '../../../components/ui';
import { isValidEmailFormat, normalizeEmailForDedupe } from '../../../utils/email';
import { useAuth } from '../../auth';
import { getSession } from '../../auth/api/auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchTeamRosterForShop } from '../api/fetchTeamRosterForOwner';
import { postTeamInvite } from '../api/postTeamInvite';
import {
  TEAM_INVITE_INVALID_EMAIL,
  TEAM_MEMBERS_LOAD_ERROR,
  TEAM_REMOVE_TOAST,
} from '../constants/teamMembersCopy';
import { teamRosterQueryKey } from '../queryKeys';

/**
 * Owner team list from Supabase + server invite. Remove is still local until that API lands.
 */
export function useTeamMembersUi() {
  const toast = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw error;
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const shopId = businessQ.data?.id ?? null;

  const rosterQ = useQuery({
    queryKey: teamRosterQueryKey(userId),
    queryFn: async () => {
      const result = await fetchTeamRosterForShop(shopId);
      if (result.error) {
        throw result.error;
      }
      return result;
    },
    enabled: Boolean(shopId),
    staleTime: 60 * 1000,
  });

  const members = rosterQ.data?.members ?? [];
  const hasShop = Boolean(shopId);
  const showTeamRow = !(businessQ.isFetched && !hasShop);
  const isLoading = Boolean(shopId) && rosterQ.isPending && rosterQ.data == null;
  const isFetching = rosterQ.isFetching;
  const listError = rosterQ.isError
    ? (rosterQ.error?.message ?? TEAM_MEMBERS_LOAD_ERROR)
    : null;

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);
  const closeRemove = useCallback(() => setMemberToRemove(null), []);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
  }, [queryClient, userId]);

  const handleInvite = useCallback(
    async (emailRaw) => {
      const email = normalizeEmailForDedupe(emailRaw);
      if (!email || !isValidEmailFormat(email)) {
        return { ok: false, error: TEAM_INVITE_INVALID_EMAIL };
      }

      const { data } = await getSession();
      const accessToken = data?.session?.access_token;
      const result = await postTeamInvite(accessToken, email);
      if (!result.ok) {
        return { ok: false, error: result.userMessage };
      }

      await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
      return { ok: true, resent: result.resent };
    },
    [queryClient, userId],
  );

  const handleRemove = useCallback(
    (member) => {
      queryClient.setQueryData(teamRosterQueryKey(userId), (current) => {
        if (!current) return current;
        return {
          ...current,
          members: current.members.filter((row) => row.id !== member.id),
        };
      });
      setMemberToRemove(null);
      toast.success(TEAM_REMOVE_TOAST);
    },
    [queryClient, toast, userId],
  );

  return {
    members,
    hasShop,
    showTeamRow,
    isLoading,
    isFetching,
    listError,
    inviteOpen,
    memberToRemove,
    openInvite,
    closeInvite,
    closeRemove,
    setMemberToRemove,
    handleInvite,
    handleRemove,
    refetch,
  };
}
