import { TEAM_EARLY_ACCESS_EMAILS } from '../../constants/teamFeatureFlags';
import { isTeamEarlyAccessEmail, resolveTeamAccess } from '../resolveTeamAccess';

describe('team rollout allowlist', () => {
  it('is open to every owner', () => {
    expect(TEAM_EARLY_ACCESS_EMAILS).toEqual([]);
  });
});

describe('resolveTeamAccess', () => {
  it('disables Team when the master flag is off', () => {
    expect(
      resolveTeamAccess({
        enabled: false,
        email: 'jesuss387@gmail.com',
      }),
    ).toEqual({
      featureEnabled: false,
      canSeeTeam: false,
    });
  });

  it('does not special-case the former early-access login', () => {
    expect(
      resolveTeamAccess({
        enabled: true,
        email: 'jesuss387@gmail.com',
      }),
    ).toEqual({
      featureEnabled: true,
      canSeeTeam: true,
    });
  });

  it('hides Team from everyone else while the allowlist is on', () => {
    expect(
      resolveTeamAccess({
        enabled: true,
        email: 'owner@example.com',
        restrictToEarlyAccess: true,
      }),
    ).toEqual({
      featureEnabled: false,
      canSeeTeam: false,
    });
  });

  it('opens Team to every login by default', () => {
    expect(
      resolveTeamAccess({
        enabled: true,
        email: 'owner@example.com',
      }),
    ).toEqual({
      featureEnabled: true,
      canSeeTeam: true,
    });
  });

  it('opens Team to every login when the allowlist is off', () => {
    expect(
      resolveTeamAccess({
        enabled: true,
        email: 'owner@example.com',
        restrictToEarlyAccess: false,
      }),
    ).toEqual({
      featureEnabled: true,
      canSeeTeam: true,
    });
  });

  it('matches nobody while the allowlist is empty', () => {
    expect(isTeamEarlyAccessEmail('owner@example.com')).toBe(false);
  });
});
