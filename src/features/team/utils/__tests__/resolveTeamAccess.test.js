import { TEAM_EARLY_ACCESS_EMAILS } from '../../constants/teamFeatureFlags';
import { isTeamEarlyAccessEmail, resolveTeamAccess } from '../resolveTeamAccess';

describe('team rollout allowlist', () => {
  it('restricts Team to the prod test login', () => {
    expect(TEAM_EARLY_ACCESS_EMAILS).toEqual(['jesuss387@gmail.com']);
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

  it('allows the allowlisted email', () => {
    expect(
      resolveTeamAccess({
        enabled: true,
        email: '  Jesuss387@Gmail.com ',
        restrictToEarlyAccess: true,
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

  it('matches allowlisted emails case-insensitively', () => {
    expect(isTeamEarlyAccessEmail('JESUSS387@GMAIL.COM')).toBe(true);
    expect(isTeamEarlyAccessEmail('other@example.com')).toBe(false);
  });
});
