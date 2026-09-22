import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { getSession, signOut as signOutRequest } from '../../auth/api/auth';
import { ensureUserProfileRow } from '../../auth/api/ensureUserProfile';
import { useAuth } from '../../auth';
import { queryClient } from '../../../lib/queryClient';
import { accountSettingsQueryKey } from '../../more/queryKeys';
import { fetchBusinessMembershipForUser } from '../../home/api/homeDashboard';
import { useTeamMembershipRealtime } from '../../shop/hooks/useTeamMembershipRealtime';
import { activeBusinessMembershipQueryKey } from '../../shop/queryKeys';
import { shopProfileQueryOptions } from '../../shop/shopProfileQueryOptions';
import { resolvePostAuthDestination } from '../../shop/utils/resolvePostAuthDestination';
import { fetchProfilesOnboardingState } from '../api/fetchProfilesOnboardingState';
import { markOnboardingCompleted } from '../api/onboardingV2Api';

const OnboardingGateContext = createContext(null);

export function OnboardingGateProvider({ children }) {
  const { session, user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  /** Full-screen handoff after step 5 “Activate” — hides stack swap / deep-link flash until main app is ready. */
  const [postActivationHandoff, setPostActivationHandoff] = useState(false);
  const [choseOwnBusiness, setChoseOwnBusiness] = useState(false);

  const beginPostActivationHandoff = useCallback(() => {
    setPostActivationHandoff(true);
  }, []);

  const endPostActivationHandoff = useCallback(() => {
    setPostActivationHandoff(false);
  }, []);

  useEffect(() => {
    if (!session) {
      setPostActivationHandoff(false);
      setChoseOwnBusiness(false);
    }
  }, [session]);

  const profileQuery = useQuery({
    queryKey: ['profiles-onboarding', userId],
    enabled: Boolean(session && userId),
    queryFn: async () => {
      const { data: sessWrap } = await getSession();
      const s = sessWrap?.session;
      if (!s?.user?.id) {
        throw new Error('No session');
      }
      const ensured = await ensureUserProfileRow(s);
      if (!ensured.ok) {
        throw new Error('ENSURE_PROFILE_FAILED');
      }
      return fetchProfilesOnboardingState(s.user.id);
    },
    retry: false,
    staleTime: 15_000,
  });

  const membershipQuery = useQuery({
    queryKey: activeBusinessMembershipQueryKey(userId),
    enabled: Boolean(session && userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessMembershipForUser(userId);
      if (error) {
        throw error;
      }
      return data;
    },
    retry: false,
    staleTime: (query) => {
      const status = query.state.data?.status;
      return status === 'active' || status === 'removed' ? 0 : 15_000;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'active' || status === 'removed' ? 15_000 : false;
    },
  });

  const isActiveMember = membershipQuery.data?.status === 'active';
  const wasRemovedFromTeam = membershipQuery.data?.status === 'removed';
  const hasHireMembership = isActiveMember || wasRemovedFromTeam;

  useTeamMembershipRealtime(session && userId ? userId : null);

  useEffect(() => {
    if (!session || !userId || !hasHireMembership) {
      return undefined;
    }
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') {
        return;
      }
      void qc.invalidateQueries({ queryKey: activeBusinessMembershipQueryKey(userId) });
    });
    return () => sub.remove();
  }, [hasHireMembership, qc, session, userId]);

  const shopQuery = useQuery({
    ...shopProfileQueryOptions(userId),
    enabled: Boolean(session && userId && isActiveMember),
  });

  useEffect(() => {
    if (!profileQuery.error) {
      return;
    }
    const msg = String(profileQuery.error?.message ?? '');
    if (msg === 'ENSURE_PROFILE_FAILED' || msg === 'No session') {
      void (async () => {
        await signOutRequest();
        queryClient.clear();
      })();
    }
  }, [profileQuery.error]);

  const isGateReady =
    !session ||
    !userId ||
    (!membershipQuery.isPending &&
      (isActiveMember ? shopQuery.isFetched : !profileQuery.isPending));

  const onboardingDone =
    profileQuery.isSuccess &&
    (profileQuery.data?.onboarding_status ?? 'not_started') === 'completed';
  const onboardingInProgress = Boolean(
    profileQuery.isSuccess &&
    !onboardingDone &&
    (profileQuery.data?.onboarding_status ?? 'not_started') !== 'not_started',
  );

  const postAuthDestination =
    session &&
    userId &&
    !membershipQuery.isPending &&
    (profileQuery.isSuccess || profileQuery.isError)
      ? resolvePostAuthDestination({
          isActiveMember,
          wasRemovedFromTeam,
          onboardingDone,
          onboardingInProgress,
          choseOwnBusiness,
        })
      : null;

  const needsRemovedFromTeam = postAuthDestination === 'removed';
  const needsOnboarding = postAuthDestination === 'onboarding';

  const startOwnBusiness = useCallback(() => {
    setChoseOwnBusiness(true);
  }, []);

  const isOnboardingProfileLoaded = profileQuery.isSuccess;
  const onboardingStep = profileQuery.isSuccess ? profileQuery.data.onboarding_step : 1;
  const onboardingStatus = profileQuery.isSuccess
    ? profileQuery.data.onboarding_status
    : 'not_started';

  const refetchOnboarding = useCallback(() => {
    if (!userId) {
      return Promise.resolve();
    }
    return qc.invalidateQueries({ queryKey: ['profiles-onboarding', userId] });
  }, [qc, userId]);

  const completeOnboarding = useCallback(async () => {
    if (!userId) {
      return { ok: false, error: new Error('Not signed in') };
    }
    const result = await markOnboardingCompleted(userId);
    if (result.ok) {
      await qc.invalidateQueries({ queryKey: ['profiles-onboarding', userId] });
      await qc.invalidateQueries({ queryKey: accountSettingsQueryKey(userId) });
    }
    return result;
  }, [qc, userId]);

  const value = useMemo(
    () => ({
      needsOnboarding,
      needsRemovedFromTeam,
      startOwnBusiness,
      isGateReady,
      isOnboardingProfileLoaded,
      onboardingStep,
      onboardingStatus,
      refetchOnboarding,
      completeOnboarding,
      profileLoadError: profileQuery.isError ? profileQuery.error : null,
      postActivationHandoff,
      beginPostActivationHandoff,
      endPostActivationHandoff,
    }),
    [
      needsOnboarding,
      needsRemovedFromTeam,
      startOwnBusiness,
      isGateReady,
      isOnboardingProfileLoaded,
      onboardingStep,
      onboardingStatus,
      refetchOnboarding,
      completeOnboarding,
      profileQuery.isError,
      profileQuery.error,
      postActivationHandoff,
      beginPostActivationHandoff,
      endPostActivationHandoff,
    ],
  );

  return <OnboardingGateContext.Provider value={value}>{children}</OnboardingGateContext.Provider>;
}

export function useOnboardingGate() {
  const ctx = useContext(OnboardingGateContext);
  if (!ctx) {
    throw new Error('useOnboardingGate must be used within OnboardingGateProvider');
  }
  return ctx;
}
