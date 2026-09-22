import { resolvePostAuthDestination } from '../resolvePostAuthDestination';

describe('resolvePostAuthDestination', () => {
  it('sends an active member or finished owner to main', () => {
    expect(resolvePostAuthDestination({ isActiveMember: true })).toBe('main');
    expect(resolvePostAuthDestination({ onboardingDone: true })).toBe('main');
  });

  it('restores a rehired teammate to main', () => {
    expect(
      resolvePostAuthDestination({
        isActiveMember: true,
        wasRemovedFromTeam: true,
      }),
    ).toBe('main');
  });

  it('sends a removed hire to the access-ended screen', () => {
    expect(
      resolvePostAuthDestination({
        wasRemovedFromTeam: true,
        onboardingDone: false,
      }),
    ).toBe('removed');
  });

  it('lets a removed hire start their own business', () => {
    expect(
      resolvePostAuthDestination({
        wasRemovedFromTeam: true,
        choseOwnBusiness: true,
      }),
    ).toBe('onboarding');
  });

  it('keeps in-progress owner onboarding instead of the removed screen', () => {
    expect(
      resolvePostAuthDestination({
        wasRemovedFromTeam: true,
        onboardingInProgress: true,
      }),
    ).toBe('onboarding');
  });

  it('sends a new owner with no shop to onboarding', () => {
    expect(resolvePostAuthDestination({})).toBe('onboarding');
  });
});
