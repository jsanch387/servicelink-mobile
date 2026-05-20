import { serviceMultiplePricingAccessCopy } from '../constants/servicePricingAccessCopy';

describe('serviceMultiplePricingAccessCopy', () => {
  it('uses App Store–safe language without upgrade or Pro product terms', () => {
    const blob = JSON.stringify(serviceMultiplePricingAccessCopy);
    expect(blob).not.toMatch(/upgrade/i);
    expect(blob).not.toMatch(/\bpro\b/i);
    expect(serviceMultiplePricingAccessCopy.buttonTitle).toBe('Sign in on the web');
  });

  it('describes saved options without Pro gating language', () => {
    expect(serviceMultiplePricingAccessCopy.collapsedSubtitleWithSaved(2)).toBe(
      '2 saved · manage on the ServiceLink website',
    );
    expect(serviceMultiplePricingAccessCopy.collapsedSubtitleWithSaved(2)).not.toMatch(/pro/i);
  });
});
