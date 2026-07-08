function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Owner-added fees persisted on `booking_session_fee_lines` after complete / tap to pay.
 *
 * @param {unknown} feeLines
 * @returns {Array<{ id: string; name: string; price: number }>}
 */
export function parseSessionFeeLinesFromBooking(feeLines) {
  if (!Array.isArray(feeLines)) {
    return [];
  }

  return feeLines
    .map((item, idx) => {
      const cents = numberOrZero(item?.amount_cents ?? item?.amountCents);
      const label = String(item?.label ?? item?.name ?? '').trim() || `Additional fee ${idx + 1}`;
      return {
        id: String(item?.id ?? `session-fee-${idx + 1}`),
        name: label,
        price: cents / 100,
      };
    })
    .filter((item) => item.price >= 0);
}
