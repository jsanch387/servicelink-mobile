/**
 * @param {number} step
 * @param {object} s
 * @param {string} s.priceUsdText
 * @param {string} s.durationHhMm
 * @param {string} [s.preferredDateYyyyMmDd]
 * @param {string} [s.preferredTime12h]
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
    case 1: {
      const date = String(s.preferredDateYyyyMmDd ?? '').trim();
      if (!date) return true;
      return Boolean(String(s.preferredTime12h ?? '').trim());
    }
    case 2:
      return canAdvanceMaintenanceInviteStep(0, s);
    default:
      return false;
  }
}
