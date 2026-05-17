import { parsePaywallUpgradeReturnResult } from '../utils/parsePaywallUpgradeReturnUrl';

describe('parsePaywallUpgradeReturnResult', () => {
  it('returns success for upgrade success deep link', () => {
    expect(
      parsePaywallUpgradeReturnResult({
        type: 'success',
        url: 'servicelinkmobile://paywall/stripe?result=success',
      }),
    ).toBe('success');
  });

  it('returns cancel for upgrade cancel deep link', () => {
    expect(
      parsePaywallUpgradeReturnResult({
        type: 'success',
        url: 'servicelinkmobile://paywall/stripe?result=cancel',
      }),
    ).toBe('cancel');
  });

  it('returns null when the auth session was dismissed', () => {
    expect(parsePaywallUpgradeReturnResult({ type: 'cancel' })).toBeNull();
  });
});
