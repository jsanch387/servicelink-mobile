/** UI state — matches web `DepositAmountMode`. */
export const DEPOSIT_AMOUNT_MODE = {
  FIXED: 'fixed',
  PERCENTAGE: 'percentage',
};

/** API / DB `depositType` (percentage UI → `percent`). */
export const DEPOSIT_TYPE_API = {
  FIXED: 'fixed',
  PERCENT: 'percent',
};

export function depositModeToApiType(mode) {
  return mode === DEPOSIT_AMOUNT_MODE.PERCENTAGE
    ? DEPOSIT_TYPE_API.PERCENT
    : DEPOSIT_TYPE_API.FIXED;
}
