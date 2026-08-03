import { normalizePhoneForDatabase } from '../../../../utils/phone';
import { isCompleteVisitPaidInFullOnline } from './completeVisitPaymentState';
import { getMarkCompletePreviewFromBooking } from './markCompletePreview';
import { parseAddonLineItemsFromBooking } from './parseAddonLineItemsFromBooking';
import { parseCompleteVisitServiceLine } from './parseCompleteVisitServiceLine';
import { parseJobDetailsFromBooking } from './parseJobDetailsFromBooking';
import { resolveBookingDiscount } from './resolveBookingDiscount';

/**
 * @typedef {object} CompleteVisitLineItem
 * @property {string} id
 * @property {string} label
 * @property {string | null | undefined} [sublabel]
 * @property {number} amount
 * @property {string} [jobId]
 * @property {'service' | 'addon' | 'discount'} [kind]
 */

/**
 * @typedef {object} CompleteVisitJob
 * @property {string} id
 * @property {string} serviceName
 * @property {string | null} pricingOption
 * @property {string} vehicleLine
 * @property {number} servicePrice
 * @property {Array<{ id: string; name: string; price: number }>} addOns
 */

/**
 * @typedef {object} CompleteVisitModel
 * @property {CompleteVisitLineItem[]} lineItems
 * @property {CompleteVisitJob[] | null} jobs — multi-job cards when length > 1; null for single-job UI
 * @property {boolean} isMultiJob
 * @property {number} paidOnline — dollars already collected online
 * @property {number} remainingAmountCents — from booking_payments; 0 when nothing left to collect
 * @property {boolean} isPaidInFullOnline — customer prepaid the full total online
 * @property {string | null} customerEmail
 * @property {string | null} customerPhone
 * @property {boolean} showReviewSms
 * @property {boolean} showReviewEmail
 * @property {boolean} showReviewInvite
 * @property {boolean} showInvoiceEmail
 */

/**
 * Flat receipt lines from `job_details` (services + per-job add-ons).
 *
 * @param {ReturnType<typeof parseJobDetailsFromBooking>} parsedJobs
 * @returns {CompleteVisitLineItem[]}
 */
function buildLineItemsFromJobs(parsedJobs) {
  /** @type {CompleteVisitLineItem[]} */
  const lineItems = [];
  for (const job of parsedJobs) {
    lineItems.push({
      id: `job-${job.id}-service`,
      label: job.serviceName,
      ...(job.pricingOption ? { sublabel: job.pricingOption } : {}),
      amount: job.servicePrice,
      jobId: job.id,
      kind: 'service',
    });
    for (const addon of job.addOns) {
      lineItems.push({
        id: `job-${job.id}-addon-${addon.id}`,
        label: addon.name,
        amount: addon.price,
        jobId: job.id,
        kind: 'addon',
      });
    }
  }
  return lineItems;
}

/**
 * Legacy single-service lines from top-level booking columns.
 *
 * @param {Record<string, unknown>} booking
 * @returns {CompleteVisitLineItem[]}
 */
function buildLineItemsFromLegacyColumns(booking) {
  const { label: serviceLabel, sublabel: serviceSublabel } = parseCompleteVisitServiceLine(booking);
  const serviceCents = Number(booking.service_price_cents);
  const serviceAmount = Number.isFinite(serviceCents) ? Math.max(0, serviceCents) / 100 : 0;

  /** @type {CompleteVisitLineItem[]} */
  const lineItems = [
    {
      id: 'service',
      label: serviceLabel,
      ...(serviceSublabel ? { sublabel: serviceSublabel } : {}),
      amount: serviceAmount,
      kind: 'service',
    },
  ];

  for (const addon of parseAddonLineItemsFromBooking(booking.addon_details)) {
    lineItems.push({ id: addon.id, label: addon.name, amount: addon.price, kind: 'addon' });
  }

  return lineItems;
}

/**
 * Receipt / payment model for the complete-visit sheet from a booking row (+ optional preview).
 *
 * Prefers `job_details` when present so multi-job visits show every service + add-on
 * (top-level `service_price_cents` / `addon_details` may only reflect the first job).
 *
 * @param {Record<string, unknown> | null | undefined} booking
 * @param {import('./markCompletePreview').MarkCompletePreview | null | undefined} [preview]
 * @param {{ canUseSms?: boolean }} [options] Only used when `preview` is omitted.
 * @returns {CompleteVisitModel | null}
 */
export function buildCompleteVisitModelFromBooking(booking, preview, options) {
  if (!booking || typeof booking !== 'object') {
    return null;
  }

  const parsedJobs = parseJobDetailsFromBooking(booking.job_details);
  const useJobDetails = parsedJobs.length > 0;
  const isMultiJob = parsedJobs.length > 1;

  /** @type {CompleteVisitLineItem[]} */
  let lineItems = useJobDetails
    ? buildLineItemsFromJobs(parsedJobs)
    : buildLineItemsFromLegacyColumns(booking);

  // Same heal as booking details: empty job_details add-ons + legacy addon_details.
  if (useJobDetails) {
    const jobHasAddOns = parsedJobs.some((job) => (job.addOns ?? []).length > 0);
    if (!jobHasAddOns) {
      const legacyAddonLines = parseAddonLineItemsFromBooking(booking.addon_details);
      if (legacyAddonLines.length > 0) {
        const firstJobId = parsedJobs[0]?.id;
        for (const addon of legacyAddonLines) {
          lineItems.push({
            id: addon.id,
            label: addon.name,
            amount: addon.price,
            ...(firstJobId ? { jobId: firstJobId } : {}),
            kind: 'addon',
          });
        }
      }
    }
  }

  const discount = resolveBookingDiscount(booking);
  if (discount) {
    lineItems.push({
      id: 'discount',
      label: discount.label,
      amount: -discount.discountDollars,
      kind: 'discount',
    });
  }

  /** @type {CompleteVisitJob[] | null} */
  const jobs = isMultiJob
    ? parsedJobs.map((job) => ({
        id: job.id,
        serviceName: job.serviceName,
        pricingOption: job.pricingOption,
        vehicleLine: job.vehicleLine,
        servicePrice: job.servicePrice,
        addOns: job.addOns,
      }))
    : null;

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

  // Heal stale remaining when payment total matches pre-job-details first-job only,
  // but line items (from job_details) are the visit net the owner should collect.
  if (
    useJobDetails &&
    paymentTotalCents > 0 &&
    paymentTotalCents < subtotalCents &&
    remainingAmountCents < subtotalCents - paidOnlineCents
  ) {
    remainingAmountCents = Math.max(0, subtotalCents - paidOnlineCents);
  }

  const isPaidInFullOnline = isCompleteVisitPaidInFullOnline({
    paidOnlineCents,
    remainingAmountCents,
    subtotalCents,
  });

  const customerEmail = String(booking.customer_email ?? '').trim() || null;
  const customerPhone = normalizePhoneForDatabase(String(booking.customer_phone ?? '')) || null;
  const resolvedPreview = preview ?? getMarkCompletePreviewFromBooking(booking, options);

  return {
    lineItems,
    jobs,
    isMultiJob,
    paidOnline,
    remainingAmountCents,
    isPaidInFullOnline,
    customerEmail,
    customerPhone,
    showReviewSms: Boolean(resolvedPreview.showReviewSmsMessage),
    showReviewEmail: Boolean(resolvedPreview.showReviewInviteMessage),
    showReviewInvite: resolvedPreview.showReviewInvite !== false,
    showInvoiceEmail: Boolean(customerEmail),
  };
}
