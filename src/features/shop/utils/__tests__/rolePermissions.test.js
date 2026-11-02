import { can, permissionsForRole } from '../rolePermissions';

describe('rolePermissions', () => {
  it('keeps booking writes off a member', () => {
    const permissions = permissionsForRole('member');
    expect(can({ isOwner: false, permissions }, 'bookings.run')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.write')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'bookings.delete')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'customers.read')).toBe(false);
  });

  it('gives a coordinator calendar writes and not the office', () => {
    const permissions = permissionsForRole('coordinator');
    expect(can({ isOwner: false, permissions }, 'bookings.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'bookings.delete')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'customers.read')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'team.manage')).toBe(false);
  });

  it('gives a manager the office and not the owner locks', () => {
    const permissions = permissionsForRole('manager');
    expect(can({ isOwner: false, permissions }, 'customers.read')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'quotes.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'invoices.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'expenses.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'reviews.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'profile.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'services.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'availability.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'marketing.write')).toBe(true);
    expect(can({ isOwner: false, permissions }, 'payments.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'billing.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'team.manage')).toBe(false);
    expect(can({ isOwner: false, permissions }, 'account.delete')).toBe(false);
  });

  it('lets the owner pass every check', () => {
    expect(can({ isOwner: true, permissions: [] }, 'bookings.delete')).toBe(true);
    expect(can({ isOwner: true, permissions: [] }, 'payments.manage')).toBe(true);
  });
});
