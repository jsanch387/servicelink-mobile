import { canUseShopTools } from '../canUseShopTools';

describe('canUseShopTools', () => {
  it('lets a Pro owner use shop tools', () => {
    expect(canUseShopTools({ hasProAccess: true, isMember: false, canSeeOffice: true })).toBe(true);
  });

  it('keeps a free owner on the subscribe path', () => {
    expect(canUseShopTools({ hasProAccess: false, isMember: false, canSeeOffice: true })).toBe(
      false,
    );
  });

  it('lets a manager use the shop tools without a personal Pro plan', () => {
    expect(canUseShopTools({ hasProAccess: false, isMember: true, canSeeOffice: true })).toBe(true);
  });

  it('does not unlock tools for a hire who cannot see the office', () => {
    expect(canUseShopTools({ hasProAccess: false, isMember: true, canSeeOffice: false })).toBe(
      false,
    );
  });
});
