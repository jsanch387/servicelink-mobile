function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {unknown} kind
 * @param {number} signedCents
 * @returns {'fee' | 'discount'}
 */
function lineKind(kind, signedCents) {
  const raw = String(kind ?? '')
    .trim()
    .toLowerCase();
  if (raw === 'discount') {
    return 'discount';
  }
  if (raw === 'fee') {
    return 'fee';
  }
  return signedCents < 0 ? 'discount' : 'fee';
}

/**
 * Owner-added fees and discounts on `booking_session_fee_lines`.
 * `price` is always positive. `kind` says which side of the visit it is.
 * Rows saved before `kind` existed stay fees.
 *
 * @param {unknown} feeLines
 * @returns {Array<{ id: string; name: string; price: number; kind: 'fee' | 'discount' }>}
 */
export function parseSessionFeeLinesFromBooking(feeLines) {
  if (!Array.isArray(feeLines)) {
    return [];
  }

  return feeLines
    .map((item, idx) => {
      const signedCents = numberOrZero(item?.amount_cents ?? item?.amountCents);
      const kind = lineKind(item?.kind, signedCents);
      const cents = Math.abs(signedCents);
      const fallback = kind === 'discount' ? `Discount ${idx + 1}` : `Additional fee ${idx + 1}`;
      const label = String(item?.label ?? item?.name ?? '').trim() || fallback;
      return {
        id: String(item?.id ?? `session-fee-${idx + 1}`),
        name: label,
        price: cents / 100,
        kind,
      };
    })
    .filter((item) => item.price > 0);
}
