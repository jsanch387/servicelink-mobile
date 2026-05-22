import { linkViewsPeriodAccessCopy } from '../constants/linkViewsAccessCopy';

describe('linkViewsPeriodAccessCopy', () => {
  it('uses App Store–safe language (no upgrade or Pro product terms)', () => {
    const blob = JSON.stringify(linkViewsPeriodAccessCopy).toLowerCase();
    expect(blob).not.toMatch(/\bupgrade\b/);
    expect(blob).not.toMatch(/\bpro\b/);
    expect(linkViewsPeriodAccessCopy.inlineAction).toBe('Sign in on the web');
  });
});
