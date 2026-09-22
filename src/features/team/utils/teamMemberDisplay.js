import { presentPersonDisplay } from '../../../utils/presentPersonDisplay';

/**
 * @param {{ name?: string | null; email?: string | null } | null | undefined} member
 * @returns {{ title: string; subtitle: string; initial: string }}
 */
export function presentTeamMember(member) {
  const name = String(member?.name ?? '').trim();
  const email = String(member?.email ?? '').trim();
  const display = presentPersonDisplay(name || email, email);
  return {
    title: display.title || 'Team member',
    subtitle: email,
    initial: display.initial,
  };
}

export function teamMemberDisplayName(member) {
  return presentTeamMember(member).title;
}

export function emailInitial(email) {
  return presentTeamMember({ email }).initial;
}
