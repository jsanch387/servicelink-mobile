import { hasTeamPlanAccess } from '../resolveTeamPlanAccess';

describe('hasTeamPlanAccess', () => {
  it('allows an entitled Team plan', () => {
    expect(
      hasTeamPlanAccess({
        subscriptionPlan: 'team',
        hasProAccess: true,
      }),
    ).toBe(true);
  });

  it('blocks Pro without a Team plan', () => {
    expect(
      hasTeamPlanAccess({
        subscriptionPlan: null,
        hasProAccess: true,
      }),
    ).toBe(false);
  });

  it('blocks free', () => {
    expect(
      hasTeamPlanAccess({
        subscriptionPlan: null,
        hasProAccess: false,
      }),
    ).toBe(false);
  });

  it('blocks a lapsed Team plan', () => {
    expect(
      hasTeamPlanAccess({
        subscriptionPlan: 'team',
        hasProAccess: false,
      }),
    ).toBe(false);
  });

  it('keeps invites for shops that already include Team', () => {
    expect(
      hasTeamPlanAccess({
        subscriptionPlan: null,
        hasProAccess: false,
        teamIncluded: true,
      }),
    ).toBe(true);
    expect(
      hasTeamPlanAccess({
        subscriptionPlan: null,
        hasProAccess: true,
        teamIncluded: true,
      }),
    ).toBe(true);
  });
});
