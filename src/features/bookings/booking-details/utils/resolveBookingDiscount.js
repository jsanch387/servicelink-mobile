/**
 * Reads marketing discount snapshot columns from a booking row.
 *
 * @param {Record<string, unknown> | null | undefined} booking
 * @returns {{
 *   discountCents: number;
 *   discountDollars: number;
 *   label: string;
 *   source: string | null;
 *   saleId: string | null;
 *   promoCodeId: string | null;
 * } | null}
 */
export function resolveBookingDiscount(booking) {
  if (!booking || typeof booking !== 'object') return null;

  const discountCents = Math.max(0, Math.round(Number(booking.discount_cents ?? 0) || 0));
  if (discountCents <= 0) return null;

  const labelRaw = String(booking.discount_label ?? '').trim();
  const source = String(booking.discount_source ?? '')
    .trim()
    .toLowerCase();
  const label =
    labelRaw || (source === 'promo' ? 'Promo code' : source === 'sale' ? 'Sale' : 'Discount');

  const saleIdRaw = booking.discount_sale_id;
  const promoIdRaw = booking.discount_promo_code_id;

  return {
    discountCents,
    discountDollars: discountCents / 100,
    label,
    source: source || null,
    saleId: saleIdRaw != null && String(saleIdRaw).trim() ? String(saleIdRaw) : null,
    promoCodeId: promoIdRaw != null && String(promoIdRaw).trim() ? String(promoIdRaw) : null,
  };
}
