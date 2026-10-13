/**
 * Whether this login can open More → Expenses.
 * Pro owners use the list. Other office owners see the subscribe card.
 * Members do not open Expenses.
 *
 * @param {{
 *   canSeeOffice?: boolean;
 *   hasProAccess?: boolean;
 *   profileLoaded?: boolean;
 * }} [params]
 * @returns {{
 *   canSeeExpenses: boolean;
 *   canUseExpenses: boolean;
 *   showUpsell: boolean;
 *   isReady: boolean;
 * }}
 */
export function resolveExpenseAccess({
  canSeeOffice = false,
  hasProAccess = false,
  profileLoaded = false,
} = {}) {
  if (!profileLoaded) {
    return { canSeeExpenses: false, canUseExpenses: false, showUpsell: false, isReady: false };
  }
  if (!canSeeOffice) {
    return { canSeeExpenses: false, canUseExpenses: false, showUpsell: false, isReady: true };
  }
  if (hasProAccess) {
    return { canSeeExpenses: true, canUseExpenses: true, showUpsell: false, isReady: true };
  }
  return { canSeeExpenses: true, canUseExpenses: false, showUpsell: true, isReady: true };
}
