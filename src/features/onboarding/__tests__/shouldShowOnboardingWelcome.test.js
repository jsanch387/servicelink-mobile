import { shouldShowOnboardingWelcome } from '../utils/shouldShowOnboardingWelcome';

describe('shouldShowOnboardingWelcome', () => {
  it('shows welcome only at the start of onboarding', () => {
    expect(shouldShowOnboardingWelcome(1)).toBe(true);
    expect(shouldShowOnboardingWelcome(0)).toBe(true);
  });

  it('skips welcome when resuming later steps', () => {
    expect(shouldShowOnboardingWelcome(2)).toBe(false);
    expect(shouldShowOnboardingWelcome(5)).toBe(false);
  });
});
