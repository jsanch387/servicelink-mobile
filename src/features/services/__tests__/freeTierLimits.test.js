import { FREE_TIER_MAX_SERVICES, freeTierServicesLimitCopy } from '../constants/freeTierLimits';

describe('freeTierServicesLimitCopy', () => {
  it('uses App Store–safe language without upgrade CTAs', () => {
    const copy = freeTierServicesLimitCopy(FREE_TIER_MAX_SERVICES);
    const blob = `${copy.alertTitle} ${copy.alertMessage} ${copy.inlineHint} ${copy.sheetError}`;

    expect(blob).not.toMatch(/upgrade/i);
    expect(blob).not.toMatch(/pro\b/i);
    expect(copy.alertMessage).toContain('sign in on the ServiceLink website');
    expect(copy.inlineHintAction).toBe('Sign in on the web');
  });
});
