import { canSeeTaxSettings } from '../utils/resolveTaxSettingsAccess';

describe('canSeeTaxSettings', () => {
  it('shows the taxes card for every account', () => {
    expect(canSeeTaxSettings('jesuss387@gmail.com')).toBe(true);
    expect(canSeeTaxSettings('owner@shop.com')).toBe(true);
    expect(canSeeTaxSettings('')).toBe(true);
  });
});
