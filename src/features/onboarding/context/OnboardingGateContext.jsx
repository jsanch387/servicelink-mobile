import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { getSession, signOut as signOutRequest } from '../../auth/api/auth';
import { ensureUserProfileRow } from '../../auth/api/ensureUserProfile';
import { useAuth } from '../../auth';
import { queryClient } from '../../../lib/queryClient';
import { fetchProfilesOnboardingState } from '../api/fetchProfilesOnboardingState';
import { markOnboardingCompleted } from '../api/onboardingV2Api';

const OnboardingGateContext = createContext(null);

export function OnboardingGateProvider({ children }) {
  const { session, user } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

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

  const isGateReady = !session || !userId || !profileQuery.isPending;

  const onboardingDone =
    profileQuery.isSuccess &&
    (profileQuery.data?.onboarding_status ?? 'not_started') === 'completed';

  const needsOnboarding = Boolean(
    session && userId && !onboardingDone && (profileQuery.isSuccess || profileQuery.isError),
  );

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
    await qc.invalidateQueries({ queryKey: ['profiles-onboarding', userId] });
    return result;
  }, [qc, userId]);

  const value = useMemo(
    () => ({
      needsOnboarding,
      isGateReady,
      isOnboardingProfileLoaded,
      onboardingStep,
      onboardingStatus,
      refetchOnboarding,
      completeOnboarding,
      profileLoadError: profileQuery.isError ? profileQuery.error : null,
    }),
    [
      needsOnboarding,
      isGateReady,
      isOnboardingProfileLoaded,
      onboardingStep,
      onboardingStatus,
      refetchOnboarding,
      completeOnboarding,
      profileQuery.isError,
      profileQuery.error,
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
