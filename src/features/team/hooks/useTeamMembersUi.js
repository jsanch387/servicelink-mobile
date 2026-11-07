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
import { patchTeamMemberRole } from '../api/patchTeamMemberRole';
import { postTeamInvite } from '../api/postTeamInvite';
import { postTeamRemove } from '../api/postTeamRemove';
import { storedTeamRole } from '../constants/teamRoles';
import { applyInviteNameToRoster } from '../utils/mapTeamRoster';
import {
  TEAM_INVITE_INVALID_EMAIL,
  TEAM_INVITE_INVALID_NAME,
  TEAM_PLAN_REQUIRED,
  TEAM_MEMBER_NAME_SAVED_TOAST,
  TEAM_MEMBER_ROLE_SAVED_TOAST,
  TEAM_MEMBERS_LOAD_ERROR,
  TEAM_REMOVE_TOAST,
} from '../constants/teamMembersCopy';
import { bookingAssigneesQueryKey } from '../../bookings/queryKeys';
import { useSubscription } from '../../subscription';
import { teamRosterQueryKey } from '../queryKeys';
import { hasTeamPlanAccess } from '../utils/resolveTeamPlanAccess';
import { useTeamAccess } from './useTeamAccess';

/**
 * Owner team list from Supabase. Invite and remove go through the web API.
 */
export function useTeamMembersUi() {
  const toast = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  const { canSeeTeam } = useTeamAccess();
  const { hasProAccess, isOwnerProfileLoaded, ownerProfile } = useSubscription();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
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
  const isOwnerShop = Boolean(shopId) && businessQ.data?.profile_id === userId;
  const planAllowsTeam = hasTeamPlanAccess({
    subscriptionPlan: ownerProfile?.subscription_plan,
    hasProAccess,
    teamIncluded: businessQ.data?.team_included === true,
  });
  const teamGateSettled = !canSeeTeam || (isOwnerProfileLoaded && businessQ.isFetched);
  const showTeamRow = canSeeTeam && teamGateSettled && isOwnerShop;
  const canManageTeam = showTeamRow && planAllowsTeam;

  const rosterQ = useQuery({
    queryKey: teamRosterQueryKey(userId),
    queryFn: async () => {
      const result = await fetchTeamRosterForShop(shopId);
      if (result.error) {
        throw result.error;
      }
      return result;
    },
    enabled: canManageTeam,
    staleTime: 60 * 1000,
  });

  const members = rosterQ.data?.members ?? [];
  const isLoading = canManageTeam && rosterQ.isPending && rosterQ.data == null;
  const isFetching = rosterQ.isFetching;
  const listError = rosterQ.isError ? (rosterQ.error?.message ?? TEAM_MEMBERS_LOAD_ERROR) : null;

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);
  const clearMemberError = useCallback(() => setMemberError(null), []);

  const refetch = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
  }, [queryClient, userId]);

  const handleInvite = useCallback(
    async (emailRaw, nameRaw, roleRaw) => {
      if (!canManageTeam) {
        return { ok: false, error: TEAM_PLAN_REQUIRED };
      }
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
      const result = await postTeamInvite(accessToken, email, name, storedTeamRole(roleRaw));
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
        applyInviteNameToRoster(
          current,
          email,
          result.name || name,
          result.role || storedTeamRole(roleRaw),
        ),
      );
      return { ok: true, resent: result.resent };
    },
    [canManageTeam, queryClient, shopId, userId],
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

  const handleChangeRole = useCallback(
    async (member, roleRaw) => {
      const role = storedTeamRole(roleRaw);
      if (role === storedTeamRole(member?.role)) {
        return { ok: true, role };
      }
      if (isSavingRole) {
        return { ok: false };
      }
      setIsSavingRole(true);
      setMemberError(null);
      try {
        const { data } = await getSession();
        const accessToken = data?.session?.access_token;
        const result = await patchTeamMemberRole(accessToken, {
          id: member?.id,
          source: member?.source,
          role,
        });
        if (!result.ok) {
          setMemberError(result.userMessage);
          return { ok: false, error: result.userMessage };
        }

        queryClient.setQueryData(teamRosterQueryKey(userId), (current) => {
          if (!current?.members) return current;
          return {
            ...current,
            members: current.members.map((row) =>
              row.id === member.id ? { ...row, role: result.role } : row,
            ),
          };
        });
        await queryClient.invalidateQueries({ queryKey: teamRosterQueryKey(userId) });
        setMemberError(null);
        toast.success(TEAM_MEMBER_ROLE_SAVED_TOAST);
        return { ok: true, role: result.role };
      } finally {
        setIsSavingRole(false);
      }
    },
    [isSavingRole, queryClient, toast, userId],
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
    hasShop: Boolean(shopId),
    showTeamRow,
    canManageTeam,
    teamGateSettled,
    isLoading,
    isFetching,
    listError,
    inviteOpen,
    isSavingName,
    isSavingRole,
    isRemoving,
    memberError,
    openInvite,
    closeInvite,
    clearMemberError,
    handleInvite,
    handleChangeRole,
    handleRename,
    handleRemove,
    refetch,
  };
}
