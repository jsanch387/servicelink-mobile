/**
 * @param {object} form
 * @param {string} form.priceUsdText
 * @param {string} form.durationHhMm
 * @returns {{ valid: boolean; error?: string }}
 */
export function validateMaintenanceInviteForm(form) {
  const price = String(form.priceUsdText ?? '').trim();
  if (!price) {
    return { valid: false, error: 'Enter a price per visit.' };
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return { valid: false, error: 'Enter a valid price per visit.' };
  }

  const duration = String(form.durationHhMm ?? '').trim();
  if (!duration) {
    return { valid: false, error: 'Select a service duration.' };
  }

  return { valid: true };
}
