import { parseCheckoutSessionIdFromOnboardingReturnUrl } from '../utils/parseOnboardingStripeReturnUrl';

describe('parseCheckoutSessionIdFromOnboardingReturnUrl', () => {
  it('reads session_id query', () => {
    expect(
      parseCheckoutSessionIdFromOnboardingReturnUrl(
        'servicelinkmobile://onboarding/stripe?result=success&session_id=cs_test_123',
      ),
    ).toBe('cs_test_123');
  });

  it('prefers checkout_session_id when both present', () => {
    expect(
      parseCheckoutSessionIdFromOnboardingReturnUrl(
        'servicelinkmobile://onboarding/stripe?checkout_session_id=cs_a&session_id=cs_b',
      ),
    ).toBe('cs_a');
  });

  it('returns null when missing', () => {
    expect(
      parseCheckoutSessionIdFromOnboardingReturnUrl('servicelinkmobile://onboarding/stripe'),
    ).toBeNull();
    expect(parseCheckoutSessionIdFromOnboardingReturnUrl(null)).toBeNull();
  });
});
