import { resolveShopCapabilities } from '../resolveShopCapabilities';

describe('resolveShopCapabilities', () => {
  it('hides office while the shop query is still settling', () => {
    expect(resolveShopCapabilities(null, 'user-1', { shopReady: false })).toMatchObject({
      isMember: false,
      canWriteBookings: false,
      canSeeOffice: false,
      canSeeOwnerHome: false,
      canManagePayments: false,
      canManageBilling: false,
    });
  });

  it('keeps owner-facing actions until a shop is known to belong to someone else', () => {
    expect(resolveShopCapabilities(null, 'user-1')).toEqual({
      shop: null,
      isOwner: false,
      isMember: false,
      canWriteBookings: true,
      canDeleteBookings: true,
      canSeeOffice: true,
      canSeeOwnerHome: true,
      canManagePayments: true,
      canManageBilling: true,
      canManageTeam: false,
      canDeleteAccount: false,
    });
  });

  it('treats a shop without profile_id as owner-facing (stale cache)', () => {
    const shop = { id: 'biz-1' };
    expect(resolveShopCapabilities(shop, 'user-1')).toMatchObject({
      isOwner: true,
      isMember: false,
      canWriteBookings: true,
      canSeeOffice: true,
      canManageTeam: true,
    });
  });

  it('treats the shop owner as able to write bookings and see office tools', () => {
    const shop = { id: 'biz-1', profile_id: 'user-1' };
    expect(resolveShopCapabilities(shop, 'user-1')).toMatchObject({
      isOwner: true,
      isMember: false,
      canWriteBookings: true,
      canSeeOffice: true,
      canManageTeam: true,
      canDeleteAccount: true,
    });
  });

  it('hides office and booking writes for a member', () => {
    const shop = { id: 'biz-1', profile_id: 'owner-1' };
    expect(resolveShopCapabilities(shop, 'member-1', { membershipRole: 'member' })).toMatchObject({
      isOwner: false,
      isMember: true,
      canWriteBookings: false,
      canDeleteBookings: false,
      canSeeOffice: false,
      canManageTeam: false,
      canDeleteAccount: false,
    });
  });

  it('lets a coordinator write and delete appointments without the office', () => {
    const shop = { id: 'biz-1', profile_id: 'owner-1' };
    expect(
      resolveShopCapabilities(shop, 'coord-1', { membershipRole: 'coordinator' }),
    ).toMatchObject({
      isOwner: false,
      isMember: true,
      canWriteBookings: true,
      canDeleteBookings: true,
      canSeeOffice: false,
      canSeeOwnerHome: false,
      canManagePayments: false,
      canManageBilling: false,
      canManageTeam: false,
      canDeleteAccount: false,
    });
  });

  it('lets a manager use the office and keeps the owner locks off', () => {
    const shop = { id: 'biz-1', profile_id: 'owner-1' };
    expect(resolveShopCapabilities(shop, 'mgr-1', { membershipRole: 'manager' })).toMatchObject({
      isOwner: false,
      isMember: true,
      canWriteBookings: true,
      canDeleteBookings: true,
      canSeeOffice: true,
      canSeeOwnerHome: false,
      canManagePayments: false,
      canManageBilling: false,
      canManageTeam: false,
      canDeleteAccount: false,
    });
  });
});
