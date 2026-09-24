import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useToast } from '../../../components/ui';
import { isValidEmailFormat, normalizeEmailForDedupe } from '../../../utils/email';
import { useAuth } from '../../auth';
import { getSession } from '../../auth/api/auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchTeamRosterForShop } from '../api/fetchTeamRosterForOwner';
import { persistTeamInviteName, updateTeamMemberDisplayName } from '../api/persistTeamInviteName';
import { postTeamInvite } from '../api/postTeamInvite';
import { postTeamRemove } from '../api/postTeamRemove';
import { applyInviteNameToRoster } from '../utils/mapTeamRoster';
import {
  TEAM_INVITE_INVALID_EMAIL,
  TEAM_INVITE_INVALID_NAME,
  TEAM_MEMBER_NAME_SAVED_TOAST,
  TEAM_MEMBERS_LOAD_ERROR,
  TEAM_REMOVE_TOAST,
} from '../constants/teamMembersCopy';
import { bookingAssigneesQueryKey } from '../../bookings/queryKeys';
import { teamRosterQueryKey } from '../queryKeys';
import { useTeamAccess } from './useTeamAccess';

/**
 * Owner team list from Supabase. Invite and remove go through the web API.
 */
export function useTeamMembersUi() {
  const toast = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const { canSeeTeam } = useTeamAccess();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [memberError, setMemberError] = useState(null);

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
    enabled: Boolean(shopId) && canSeeTeam,
    staleTime: 60 * 1000,
  });

  const members = rosterQ.data?.members ?? [];
  const hasShop = Boolean(shopId);
  const showTeamRow = canSeeTeam && !(businessQ.isFetched && !hasShop);
  const isLoading = Boolean(shopId) && rosterQ.isPending && rosterQ.data == null;
  const isFetching = rosterQ.isFetching;
  const listError = rosterQ.isError ? (rosterQ.error?.message ?? TEAM_MEMBERS_LOAD_ERROR) : null;

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);
  const clearMemberError = useCallback(() => setMemberError(null), []);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
  }, [queryClient, userId]);

  const handleInvite = useCallback(
    async (emailRaw, nameRaw) => {
      const name = String(nameRaw ?? '').trim();
      const email = normalizeEmailForDedupe(emailRaw);
      if (!name) {
        return { ok: false, error: TEAM_INVITE_INVALID_NAME };
      }
      if (!email || !isValidEmailFormat(email)) {
        return { ok: false, error: TEAM_INVITE_INVALID_EMAIL };
      }

      const { data } = await getSession();
      const accessToken = data?.session?.access_token;
      const result = await postTeamInvite(accessToken, email, name);
      if (!result.ok) {
        return { ok: false, error: result.userMessage };
      }

      try {
        await persistTeamInviteName(shopId, email, name);
      } catch {
        // Roster refetch + cache patch still show the typed name if this write fails.
      }
      await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
      await queryClient.invalidateQueries({ queryKey: bookingAssigneesQueryKey(userId) });
      await queryClient.refetchQueries({ queryKey: teamRosterQueryKey(userId) });
      queryClient.setQueryData(teamRosterQueryKey(userId), (current) =>
        applyInviteNameToRoster(current, email, result.name || name),
      );
      return { ok: true, resent: result.resent };
    },
    [queryClient, shopId, userId],
  );

  const handleRemove = useCallback(
    async (member) => {
      if (isRemoving) {
        return { ok: false };
      }
      setIsRemoving(true);
      setMemberError(null);
      try {
        const { data } = await getSession();
        const accessToken = data?.session?.access_token;
        const result = await postTeamRemove(accessToken, {
          id: member?.id,
          source: member?.source,
        });
        if (!result.ok && result.httpStatus !== 404) {
          setMemberError(result.userMessage);
          return { ok: false, error: result.userMessage };
        }

        queryClient.setQueryData(teamRosterQueryKey(userId), (current) => {
          if (!current) return current;
          return {
            ...current,
            members: current.members.filter((row) => row.id !== member.id),
          };
        });
        await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
        setMemberError(null);
        toast.success(TEAM_REMOVE_TOAST);
        return { ok: true };
      } finally {
        setIsRemoving(false);
      }
    },
    [isRemoving, queryClient, toast, userId],
  );

  const handleRename = useCallback(
    async (member, nameRaw) => {
      const name = String(nameRaw ?? '').trim();
      if (!name) {
        return { ok: false, error: TEAM_INVITE_INVALID_NAME };
      }
      if (isSavingName) {
        return { ok: false };
      }
      setIsSavingName(true);
      setMemberError(null);
      try {
        await updateTeamMemberDisplayName(shopId, member, name);
        queryClient.setQueryData(teamRosterQueryKey(userId), (current) =>
          applyInviteNameToRoster(current, member?.email, name),
        );
        await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
        await queryClient.invalidateQueries({ queryKey: bookingAssigneesQueryKey(userId) });
        toast.success(TEAM_MEMBER_NAME_SAVED_TOAST);
        return { ok: true };
      } catch (error) {
        const message = error?.message?.trim() || TEAM_INVITE_INVALID_NAME;
        setMemberError(message);
        return { ok: false, error: message };
      } finally {
        setIsSavingName(false);
      }
    },
    [isSavingName, queryClient, shopId, toast, userId],
  );

  return {
    members,
    hasShop,
    showTeamRow,
    isLoading,
    isFetching,
    listError,
    inviteOpen,
    isSavingName,
    isRemoving,
    memberError,
    openInvite,
    closeInvite,
    clearMemberError,
    handleInvite,
    handleRename,
    handleRemove,
    refetch,
  };
}
