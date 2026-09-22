import { useMemo } from 'react';
import { useAuth } from '../../auth';
import { TEAM_FEATURE_ENABLED } from '../constants/teamFeatureFlags';
import { resolveTeamAccess } from '../utils/resolveTeamAccess';

/**
 * Runtime Team (More → Team) access for this signed-in user.
 */
export function useTeamAccess() {
  const { user } = useAuth();

  return useMemo(
    () =>
      resolveTeamAccess({
        enabled: TEAM_FEATURE_ENABLED,
        email: user?.email ?? null,
      }),
    [user?.email],
  );
}
