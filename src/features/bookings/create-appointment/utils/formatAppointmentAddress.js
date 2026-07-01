/**
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string }} address
 */
export function formatAppointmentAddressPrimaryLine(address) {
  const street = String(address?.street ?? '').trim();
  const unit = String(address?.unit ?? '').trim();
  if (street && unit) {
    return `${street}, ${unit}`;
  }
  return street;
}

/**
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string }} address
 */
export function formatAppointmentAddressSecondaryLine(address) {
  const city = String(address?.city ?? '').trim();
  const state = String(address?.state ?? '')
    .trim()
    .toUpperCase();
  const zip = String(address?.zip ?? '').trim();
  if (!city && !state && !zip) {
    return '';
  }
  const stateZip = [state, zip].filter(Boolean).join(' ');
  return [city, stateZip].filter(Boolean).join(', ');
}

/** Comma-separated single line — review step, maps, etc. */
export function formatAppointmentAddressSingleLine(address) {
  const parts = [
    address?.street?.trim(),
    address?.unit?.trim(),
    address?.city?.trim(),
    address?.state?.trim(),
    address?.zip?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}
