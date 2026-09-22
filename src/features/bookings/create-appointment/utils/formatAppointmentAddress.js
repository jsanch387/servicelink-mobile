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

/**
 * Detail-card lines: street on top, city / state / ZIP underneath.
 * Falls back to a single primary line when street is missing.
 *
 * @param {{ street?: string; unit?: string; city?: string; state?: string; zip?: string }} address
 * @returns {{ primary: string; secondary: string }}
 */
export function formatLocationCardLines(address) {
  const streetLine = formatAppointmentAddressPrimaryLine(address);
  const locality = formatAppointmentAddressSecondaryLine(address);
  if (streetLine) {
    return { primary: streetLine, secondary: locality };
  }
  return { primary: locality, secondary: '' };
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
