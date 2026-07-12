import { supabase } from '../../../../lib/supabase';
import { applyCheckoutSnapshotToBooking } from '../utils/applyCheckoutSnapshotToBooking';
import { getBookingCheckoutSnapshot } from '../utils/bookingCheckoutSnapshotStorage';

export const BOOKING_DETAILS_SELECT = [
  'id',
  'business_id',
  'status',
  'scheduled_date',
  'start_time',
  'duration_minutes',
  'service_name',
  'service_id',
  'service_price_cents',
  'addon_details',
  'discount_source',
  'discount_promo_code_id',
  'discount_sale_id',
  'discount_type',
  'discount_value',
  'subtotal_cents',
  'discount_cents',
  'discount_label',
  'customer_name',
  'customer_phone',
  'customer_email',
  'customer_id',
  'customer_street_address',
  'customer_unit_apt',
  'customer_city',
  'customer_state',
  'customer_zip',
  'customer_vehicle_year',
  'customer_vehicle_make',
  'customer_vehicle_model',
  'customer_notes',
  'job_status',
  'work_handoff_status',
].join(', ');

const BOOKING_PAYMENTS_SELECT = [
  'payment_status',
  'payment_method_selected',
  'currency',
  'total_amount_cents',
  'paid_online_amount_cents',
  'remaining_amount_cents',
  'session_fees_total_cents',
  'session_payment_method',
  'session_payment_amount_cents',
  'session_payment_stripe_payment_intent_id',
].join(', ');

const BOOKING_SESSION_FEE_LINES_SELECT = ['id', 'label', 'amount_cents', 'sort_order'].join(', ');

const BOOKING_DETAILS_EMBED_SELECT = `${BOOKING_DETAILS_SELECT}, booking_payments (${BOOKING_PAYMENTS_SELECT}), booking_session_fee_lines (${BOOKING_SESSION_FEE_LINES_SELECT}), booking_invoices (snapshot_json)`;

/**
 * Maps a `booking_payments` row to the same camelCase shape the web dashboard uses
 * (`BookingPaymentSummaryDisplay`).
 *
 * @param {Record<string, unknown> | null | undefined} row
 */
export function mapBookingPaymentRowToSummary(row) {
  if (!row) {
    return undefined;
  }
  return {
    paymentStatus: row.payment_status ?? 'not_required',
    paymentMethodSelected: String(row.payment_method_selected ?? 'none'),
    currency:
      String(row.currency ?? 'usd')
        .trim()
        .toLowerCase() || 'usd',
    totalAmountCents: Math.max(0, Math.round(Number(row.total_amount_cents ?? 0) || 0)),
    paidOnlineAmountCents: Math.max(0, Math.round(Number(row.paid_online_amount_cents ?? 0) || 0)),
    remainingAmountCents: Math.max(0, Math.round(Number(row.remaining_amount_cents ?? 0) || 0)),
    sessionFeesTotalCents: Math.max(0, Math.round(Number(row.session_fees_total_cents ?? 0) || 0)),
    sessionPaymentMethod:
      typeof row.session_payment_method === 'string' ? row.session_payment_method : null,
    sessionPaymentAmountCents: Math.max(
      0,
      Math.round(Number(row.session_payment_amount_cents ?? 0) || 0),
    ),
    sessionPaymentStripeIntentId:
      typeof row.session_payment_stripe_payment_intent_id === 'string'
        ? row.session_payment_stripe_payment_intent_id
        : null,
  };
}

/**
 * @param {Record<string, unknown> | null | undefined} row
 */
function flattenEmbeddedBookingRow(row) {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const paymentRaw = Array.isArray(row.booking_payments)
    ? row.booking_payments[0]
    : row.booking_payments;
  const feeLines = Array.isArray(row.booking_session_fee_lines)
    ? row.booking_session_fee_lines
    : [];
  const invoiceRaw = Array.isArray(row.booking_invoices)
    ? row.booking_invoices[0]
    : row.booking_invoices;

  const {
    booking_payments: _payment,
    booking_session_fee_lines: _feeLines,
    booking_invoices: _invoice,
    ...booking
  } = row;

  return {
    ...booking,
    ...(paymentRaw ? { payment: mapBookingPaymentRowToSummary(paymentRaw) } : {}),
    session_fee_lines: feeLines,
    ...(invoiceRaw?.snapshot_json ? { invoice_snapshot: invoiceRaw.snapshot_json } : {}),
  };
}

/**
 * @param {string} bookingId
 */
async function fetchBookingPaymentSummary(bookingId) {
  const { data: row, error } = await supabase
    .from('booking_payments')
    .select(BOOKING_PAYMENTS_SELECT)
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (error || !row) {
    return undefined;
  }

  return mapBookingPaymentRowToSummary(row);
}

/**
 * @param {string} bookingId
 * @returns {Promise<{ feeLines: unknown[]; invoiceSnapshot: unknown | null }>}
 */
async function fetchSessionFeeLinesForBooking(bookingId) {
  const { data, error } = await supabase
    .from('booking_session_fee_lines')
    .select(BOOKING_SESSION_FEE_LINES_SELECT)
    .eq('booking_id', bookingId)
    .order('sort_order', { ascending: true });

  if (!error && Array.isArray(data) && data.length > 0) {
    return { feeLines: data, invoiceSnapshot: null };
  }

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from('booking_invoices')
    .select('snapshot_json')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (invoiceError || !invoiceRow?.snapshot_json) {
    return { feeLines: [], invoiceSnapshot: null };
  }

  return { feeLines: [], invoiceSnapshot: invoiceRow.snapshot_json };
}

/**
 * Prefer richer payment/fee payloads from parallel reads and embeds.
 *
 * @param {Record<string, unknown>} booking
 * @param {{
 *   payment?: Record<string, unknown>;
 *   feeLines?: unknown[];
 *   invoiceSnapshot?: unknown;
 *   embedded?: Record<string, unknown> | null;
 * }} sources
 */
function mergeBookingDetailsSources(booking, sources) {
  const embedded = sources.embedded ? flattenEmbeddedBookingRow(sources.embedded) : null;
  const embeddedPayment = embedded?.payment;
  const directPayment = sources.payment;
  const payment =
    pickRicherPaymentSummary(directPayment, embeddedPayment) ?? directPayment ?? embeddedPayment;
  const feeLines =
    Array.isArray(sources.feeLines) && sources.feeLines.length > 0
      ? sources.feeLines
      : embedded?.session_fee_lines;
  const invoiceSnapshot = sources.invoiceSnapshot ?? embedded?.invoice_snapshot ?? null;

  return {
    ...booking,
    ...(payment ? { payment } : {}),
    session_fee_lines: Array.isArray(feeLines) ? feeLines : [],
    ...(invoiceSnapshot ? { invoice_snapshot: invoiceSnapshot } : {}),
  };
}

/**
 * @param {ReturnType<typeof mapBookingPaymentRowToSummary> | undefined} a
 * @param {ReturnType<typeof mapBookingPaymentRowToSummary> | undefined} b
 */
function pickRicherPaymentSummary(a, b) {
  if (!a) {
    return b;
  }
  if (!b) {
    return a;
  }

  const score = (payment) => {
    let value = 0;
    if (payment.totalAmountCents > 0) value += 1;
    if (payment.sessionFeesTotalCents > 0) value += 4;
    if (payment.sessionPaymentAmountCents > 0) value += 4;
    if (payment.sessionPaymentMethod) value += 2;
    if (payment.sessionPaymentStripeIntentId) value += 2;
    value += payment.totalAmountCents / 1_000_000;
    return value;
  };

  return score(a) >= score(b) ? a : b;
}

/**
 * @param {string} bookingId
 */
export async function fetchBookingDetailsById(bookingId) {
  const bookingQuery = supabase
    .from('bookings')
    .select(BOOKING_DETAILS_SELECT)
    .eq('id', bookingId)
    .maybeSingle();

  const embeddedQuery = supabase
    .from('bookings')
    .select(BOOKING_DETAILS_EMBED_SELECT)
    .eq('id', bookingId)
    .maybeSingle();

  const [
    { data: booking, error: bookingError },
    payment,
    { feeLines, invoiceSnapshot },
    { data: embeddedRow },
    storedCheckout,
  ] = await Promise.all([
    bookingQuery,
    fetchBookingPaymentSummary(bookingId),
    fetchSessionFeeLinesForBooking(bookingId),
    embeddedQuery,
    getBookingCheckoutSnapshot(bookingId),
  ]);

  if (bookingError) {
    return { data: null, error: bookingError };
  }
  if (!booking) {
    return { data: null, error: null };
  }

  let merged = mergeBookingDetailsSources(booking, {
    payment,
    feeLines,
    invoiceSnapshot,
    embedded: embeddedRow,
  });

  if (storedCheckout) {
    merged = applyCheckoutSnapshotToBooking(merged, storedCheckout) ?? merged;
  }

  return { data: merged, error: null };
}

/**
 * @param {string} bookingId
 * @param {string | null | undefined} [businessId]
 */
export async function markBookingCompletedById(bookingId, businessId) {
  let query = supabase.from('bookings').update({ status: 'completed' }).eq('id', bookingId);
  const scopedBusinessId = businessId?.trim();
  if (scopedBusinessId) {
    query = query.eq('business_id', scopedBusinessId);
  }

  const { data, error } = await query.select('id, status').maybeSingle();

  return { data, error };
}

/**
 * @param {string} bookingId
 */
export async function cancelBookingById(bookingId) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .select('id, status')
    .maybeSingle();

  return { data, error };
}

/**
 * Permanently deletes the booking row. Does not delete CRM `customers` rows (bookings only store
 * snapshot fields on the row). Removes related payment rows first when present so FK constraints
 * do not block the booking delete.
 *
 * @param {string} bookingId
 */
export async function deleteBookingById(bookingId) {
  const { error: feeLinesDeleteError } = await supabase
    .from('booking_session_fee_lines')
    .delete()
    .eq('booking_id', bookingId);

  if (feeLinesDeleteError) {
    return { data: null, error: feeLinesDeleteError };
  }

  const { error: invoiceDeleteError } = await supabase
    .from('booking_invoices')
    .delete()
    .eq('booking_id', bookingId);

  if (invoiceDeleteError) {
    return { data: null, error: invoiceDeleteError };
  }

  const { error: paymentDeleteError } = await supabase
    .from('booking_payments')
    .delete()
    .eq('booking_id', bookingId);

  if (paymentDeleteError) {
    return { data: null, error: paymentDeleteError };
  }

  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId)
    .select('id')
    .maybeSingle();

  return { data, error };
}

/**
 * @param {string} bookingId
 * @param {{ scheduledDate: string; startTime: string }} payload
 */
export async function rescheduleBookingById(bookingId, payload) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      scheduled_date: payload.scheduledDate,
      start_time: payload.startTime,
    })
    .eq('id', bookingId)
    .select('id, scheduled_date, start_time')
    .maybeSingle();

  return { data, error };
}
