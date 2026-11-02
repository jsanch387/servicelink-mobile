/** Roles the owner can assign. The account owner is not one of these. */
export const ASSIGNABLE_TEAM_ROLES = ['member', 'coordinator', 'manager'];

export const TEAM_ROLE_COPY = {
  member: {
    label: 'Member',
    description:
      'Sees every appointment. Can run the job, take payment, and change who is assigned.',
  },
  coordinator: {
    label: 'Coordinator',
    description: 'Same as Member, plus adding, rescheduling, canceling, and deleting appointments.',
  },
  manager: {
    label: 'Manager',
    description: 'Same as Coordinator, plus customers, quotes, invoices, expenses, and the shop.',
  },
};

/**
 * @param {string | null | undefined} value
 * @returns {'member' | 'coordinator' | 'manager'}
 */
export function storedTeamRole(value) {
  if (value === 'coordinator' || value === 'manager') return value;
  return 'member';
}

/**
 * @param {string | null | undefined} value
 */
export function teamRoleCopy(value) {
  return TEAM_ROLE_COPY[storedTeamRole(value)];
}
