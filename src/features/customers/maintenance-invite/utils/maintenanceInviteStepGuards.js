/**
 * @param {number} step
 * @param {object} s
 * @param {string} s.priceUsdText
 * @param {string} s.durationHhMm
 */
export function canAdvanceMaintenanceInviteStep(step, s) {
  switch (step) {
    case 0: {
      const price = String(s.priceUsdText ?? '').trim();
      if (!price) return false;
      const priceNum = Number(price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) return false;

      const duration = String(s.durationHhMm ?? '').trim();
      return Boolean(duration);
    }
    case 1:
      return true;
    case 2:
      return canAdvanceMaintenanceInviteStep(0, s);
    default:
      return false;
  }
}
