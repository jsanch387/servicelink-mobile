/**
 * Splits stored booking `service_name` when it includes a pricing tier ("Base — Premium").
 *
 * @param {string | null | undefined} serviceName
 * @returns {{ primary: string; pricingOption: string | null }}
 */
export function splitBookingServiceName(serviceName) {
  const raw = String(serviceName ?? '').trim() || 'Service';
  const parts = raw
    .split(/\s*—\s*/u)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return { primary: parts[0], pricingOption: parts.slice(1).join(' — ') };
  }
  return { primary: raw, pricingOption: null };
}
