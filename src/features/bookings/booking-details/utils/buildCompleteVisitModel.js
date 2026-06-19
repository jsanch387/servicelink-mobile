import { getMarkCompletePreviewFromBooking } from './markCompletePreview';

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {unknown} addonDetails
 * @returns {Array<{ id: string; name: string; price: number }>}
 */
function parseAddonLineItems(addonDetails) {
  if (!addonDetails) {
    return [];
  }
  const parsed = typeof addonDetails === 'string' ? safeJsonParse(addonDetails) : addonDetails;
  if (!parsed) {
    return [];
  }
  const sourceItems = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.addons)
        ? parsed.addons
        : [];

  return sourceItems
    .map((item, idx) => {
      const cents = numberOrZero(item?.priceCents ?? item?.price_cents);
      const label =
        String(item?.name ?? item?.label ?? item?.title ?? '').trim() || `Add-on ${idx + 1}`;
      return {
        id: String(item?.id ?? item?.addon_id ?? `addon-${idx + 1}`),
        name: label,
        price: cents / 100,
      };
    })
    .filter((item) => item.price >= 0);
}

/**
 * @typedef {object} CompleteVisitModel
 * @property {Array<{ id: string; label: string; amount: number }>} lineItems
 * @property {number} paidOnline — dollars already collected online
 * @property {string | null} customerEmail
 * @property {boolean} showReviewSms
 * @property {boolean} showReviewEmail
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

  const serviceName = String(booking.service_name ?? '').trim() || 'Detail package';
  const serviceCents = Number(booking.service_price_cents);
  const serviceAmount = Number.isFinite(serviceCents) ? Math.max(0, serviceCents) / 100 : 0;

  /** @type {Array<{ id: string; label: string; amount: number }>} */
  const lineItems = [{ id: 'service', label: serviceName, amount: serviceAmount }];

  for (const addon of parseAddonLineItems(booking.addon_details)) {
    lineItems.push({ id: addon.id, label: addon.name, amount: addon.price });
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

  const customerEmail = String(booking.customer_email ?? '').trim() || null;
  const resolvedPreview = preview ?? getMarkCompletePreviewFromBooking(booking);

  return {
    lineItems,
    paidOnline,
    customerEmail,
    showReviewSms: Boolean(resolvedPreview.showReviewSmsMessage),
    showReviewEmail: Boolean(resolvedPreview.showReviewInviteMessage),
    showInvoiceEmail: Boolean(customerEmail),
  };
}
