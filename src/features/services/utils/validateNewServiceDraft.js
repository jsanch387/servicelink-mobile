/**
 * Plain-language checks for the new-service screen.
 * Returns a message to show, or null when the draft can be saved.
 *
 * @param {{
 *   name?: string;
 *   description?: string;
 *   price?: string;
 *   durationHHmm?: string;
 *   pricingOptions?: Array<{ label?: string; price?: string; durationHHmm?: string }>;
 * }} draft
 * @returns {string | null}
 */
export function validateNewServiceDraft({
  name,
  description,
  price,
  durationHHmm,
  pricingOptions,
}) {
  if (!String(name ?? '').trim()) return 'Add a service name.';
  if (!String(description ?? '').trim()) {
    return 'Add a short description of what customers get.';
  }
  if (!String(price ?? '').trim()) return 'Add a price.';
  if (!String(durationHHmm ?? '').trim()) return 'Choose how long it takes.';

  for (const option of pricingOptions ?? []) {
    const label = String(option?.label ?? '').trim();
    if (!label) return 'Each other price needs a name.';
    if (!String(option?.price ?? '').trim()) return `Add a price for ${label}.`;
    if (!String(option?.durationHHmm ?? '').trim()) return `Choose how long ${label} takes.`;
  }

  return null;
}
