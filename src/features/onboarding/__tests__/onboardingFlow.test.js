import { resolveOnboardingScreen, shouldStampNewOnboardingFlow } from '../utils/onboardingFlow';

describe('onboarding flow choice', () => {
  it('stamps the new setup only when nothing has started', () => {
    expect(
      shouldStampNewOnboardingFlow({ onboarding_status: 'not_started', onboarding_flow: null }),
    ).toBe(true);
    expect(
      shouldStampNewOnboardingFlow({ onboarding_status: 'in_progress', onboarding_flow: null }),
    ).toBe(false);
    expect(
      shouldStampNewOnboardingFlow({ onboarding_status: 'not_started', onboarding_flow: 'v2' }),
    ).toBe(false);
    expect(
      shouldStampNewOnboardingFlow({ onboarding_status: 'not_started', onboarding_flow: 'v3' }),
    ).toBe(false);
  });

  it('keeps the 5-step sequence unless the account is on the new setup', () => {
    expect(resolveOnboardingScreen('v3')).toBe('v3');
    expect(resolveOnboardingScreen('v2')).toBe('v2');
    expect(resolveOnboardingScreen(null)).toBe('v2');
  });
});
