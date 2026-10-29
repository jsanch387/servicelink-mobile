import { canSeeTaxSettings } from '../utils/resolveTaxSettingsAccess';

describe('canSeeTaxSettings', () => {
  it('allows only the pre-release email', () => {
    expect(canSeeTaxSettings('jesuss387@gmail.com')).toBe(true);
    expect(canSeeTaxSettings('Jesuss387@gmail.com')).toBe(true);
    expect(canSeeTaxSettings('jesuss3872@gmail.com')).toBe(false);
    expect(canSeeTaxSettings('owner@shop.com')).toBe(false);
    expect(canSeeTaxSettings('')).toBe(false);
  });
});
