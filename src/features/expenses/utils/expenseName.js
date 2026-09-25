/** One short line — enough for “Home Depot supplies”, not a note. */
export const EXPENSE_NAME_MAX_LENGTH = 40;

export function sanitizeExpenseNameInput(raw) {
  return String(raw ?? '')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, EXPENSE_NAME_MAX_LENGTH);
}
