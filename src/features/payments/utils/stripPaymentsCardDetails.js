const CARD_BRAND =
  /\b(visa|mastercard|amex|american express|discover|diners|jcb|unionpay|maestro)\b/i;

function isCardDetailSegment(segment) {
  const raw = String(segment ?? '').trim();
  if (!raw) return true;
  if (/[•●∙*]{2,}/.test(raw) && /\d{2,4}/.test(raw)) {
    return true;
  }
  if (CARD_BRAND.test(raw)) {
    return true;
  }
  if (/ending in\s+\d{3,4}/i.test(raw)) {
    return true;
  }
  if (/^\d{4}$/.test(raw)) {
    return true;
  }
  return false;
}

/**
 * Drops card brand / last-four from a painted subtitle. Keeps customer + how they paid.
 *
 * @param {string | null | undefined} line
 * @returns {string}
 */
export function stripPaymentsCardDetails(line) {
  const raw = typeof line === 'string' ? line.trim() : '';
  if (!raw) return '';
  const parts = raw
    .split(/\s*·\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return isCardDetailSegment(raw) ? '' : raw;
  }
  return parts.filter((part) => !isCardDetailSegment(part)).join(' · ');
}
