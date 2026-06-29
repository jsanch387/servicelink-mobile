import { compareAppVersions } from '../compareAppVersions';

describe('compareAppVersions', () => {
  it('orders semver segments numerically', () => {
    expect(compareAppVersions('1.0.6', '1.0.7')).toBe(-1);
    expect(compareAppVersions('1.0.7', '1.0.6')).toBe(1);
    expect(compareAppVersions('1.0.7', '1.0.7')).toBe(0);
  });

  it('treats missing segments as zero', () => {
    expect(compareAppVersions('1.0', '1.0.0')).toBe(0);
  });
});
