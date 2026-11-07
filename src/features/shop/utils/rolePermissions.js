/** Capability keys. Screens check these, not `role === 'member'`. */
const MEMBER_PERMISSIONS = ['dashboard.read', 'bookings.read', 'bookings.run'];

const COORDINATOR_PERMISSIONS = [...MEMBER_PERMISSIONS, 'bookings.write', 'bookings.delete'];

/** Calendar actions, plus the office. Payments, billing, team, and account delete stay off. */
const MANAGER_PERMISSIONS = [
  ...COORDINATOR_PERMISSIONS,
  'customers.read',
  'customers.write',
  'quotes.read',
  'quotes.write',
  'invoices.read',
  'invoices.write',
  'expenses.read',
  'expenses.write',
  'reviews.read',
  'reviews.write',
  'profile.write',
  'services.write',
  'availability.write',
  'marketing.write',
];

/**
 * @param {string | null | undefined} role
 * @returns {string[]}
 */
export function permissionsForRole(role) {
  if (role === 'coordinator') return COORDINATOR_PERMISSIONS;
  if (role === 'manager') return MANAGER_PERMISSIONS;
  return MEMBER_PERMISSIONS;
}

/**
 * Owner passes every check. A hire passes only what their role includes.
 *
 * @param {{ isOwner?: boolean; permissions?: readonly string[] }} ctx
 * @param {string} permission
 */
export function can(ctx, permission) {
  if (ctx?.isOwner) return true;
  return Boolean(ctx?.permissions?.includes(permission));
}
