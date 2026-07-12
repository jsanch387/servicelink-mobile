import { isCompleteVisitPaidInFullOnline } from './completeVisitPaymentState';
import { getMarkCompletePreviewFromBooking } from './markCompletePreview';
import { parseAddonLineItemsFromBooking } from './parseAddonLineItemsFromBooking';
import { parseCompleteVisitServiceLine } from './parseCompleteVisitServiceLine';
import { resolveBookingDiscount } from './resolveBookingDiscount';

/**
 * @typedef {object} CompleteVisitModel
 * @property {Array<{ id: string; label: string; sublabel?: string | null; amount: number }>} lineItems
 * @property {number} paidOnline — dollars already collected online
 * @property {number} remainingAmountCents — from booking_payments; 0 when nothing left to collect
 * @property {boolean} isPaidInFullOnline — customer prepaid the full total online
 * @property {string | null} customerEmail
 * @property {boolean} showReviewSms
 * @property {boolean} showReviewEmail
 * @property {boolean} showReviewInvite
 * @property {boolean} showInvoiceEmail
 */

/**
 * Receipt / payment model for the complete-visit sheet from a booking row (+ optional preview).
 *
 * @param {Record<string, unknown> | null | undefined} booking
 * @param {import('./markCompletePreview').MarkCompletePreview | null | undefined} [preview]
 * @returns {CompleteVisitModel | null}
 */
export function buildCompleteVisitModelFromBooking(booking, preview) {
  if (!booking || typeof booking !== 'object') {
    return null;
  }

  const { label: serviceLabel, sublabel: serviceSublabel } = parseCompleteVisitServiceLine(booking);
  const serviceCents = Number(booking.service_price_cents);
  const serviceAmount = Number.isFinite(serviceCents) ? Math.max(0, serviceCents) / 100 : 0;

  /** @type {Array<{ id: string; label: string; sublabel?: string | null; amount: number }>} */
  const lineItems = [
    {
      id: 'service',
      label: serviceLabel,
      ...(serviceSublabel ? { sublabel: serviceSublabel } : {}),
      amount: serviceAmount,
    },
  ];

  for (const addon of parseAddonLineItemsFromBooking(booking.addon_details)) {
    lineItems.push({ id: addon.id, label: addon.name, amount: addon.price });
  }

  const discount = resolveBookingDiscount(booking);
  if (discount) {
    lineItems.push({
      id: 'discount',
      label: discount.label,
      amount: -discount.discountDollars,
    });
  }

  const payment =
    booking.payment && typeof booking.payment === 'object'
      ? /** @type {Record<string, unknown>} */ (booking.payment)
      : null;
  const paidOnlineCents = Math.max(
    0,
    Number(payment?.paidOnlineAmountCents ?? payment?.paid_online_amount_cents ?? 0) || 0,
  );
  const paidOnline = paidOnlineCents / 100;
  const subtotalCents = Math.max(
    0,
    lineItems.reduce((sum, item) => sum + Math.round(Number(item.amount) * 100), 0),
  );
  const paymentTotalCents = Math.max(
    0,
    Number(payment?.totalAmountCents ?? payment?.total_amount_cents ?? 0) || 0,
  );
  const remainingRaw = payment?.remainingAmountCents ?? payment?.remaining_amount_cents;
  let remainingAmountCents =
    remainingRaw != null && Number.isFinite(Number(remainingRaw))
      ? Math.max(0, Math.round(Number(remainingRaw)))
      : Math.max(0, subtotalCents - paidOnlineCents);

  // Payment row may still store pre-discount totals; prefer line-item net for amount due.
  if (
    discount &&
    paymentTotalCents > 0 &&
    paymentTotalCents === subtotalCents + discount.discountCents &&
    remainingAmountCents > subtotalCents - paidOnlineCents
  ) {
    remainingAmountCents = Math.max(0, subtotalCents - paidOnlineCents);
  }
  const isPaidInFullOnline = isCompleteVisitPaidInFullOnline({
    paidOnlineCents,
    remainingAmountCents,
    subtotalCents,
  });

  const customerEmail = String(booking.customer_email ?? '').trim() || null;
  const resolvedPreview = preview ?? getMarkCompletePreviewFromBooking(booking);

  return {
    lineItems,
    paidOnline,
    remainingAmountCents,
    isPaidInFullOnline,
    customerEmail,
    showReviewSms: Boolean(resolvedPreview.showReviewSmsMessage),
    showReviewEmail: Boolean(resolvedPreview.showReviewInviteMessage),
    showReviewInvite: resolvedPreview.showReviewInvite !== false,
    showInvoiceEmail: Boolean(customerEmail),
  };
}
