export function teamMemberDisplayName(member) {
  const name = String(member?.name ?? '').trim();
  if (name) return name;
  return String(member?.email ?? '').trim() || 'Team member';
}

export function emailInitial(email) {
  const letter = String(email ?? '')
    .trim()
    .charAt(0);
  return letter ? letter.toUpperCase() : '?';
}
