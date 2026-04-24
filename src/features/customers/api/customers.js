import { supabase } from '../../../lib/supabase';
import { parseBookingStartLocalMs } from '../../home/utils/bookingStart';
import {
  CUSTOMER_FILTER_DUE,
  CUSTOMER_FILTER_NEW,
  CUSTOMER_FILTER_RETURNING,
  NEEDS_ATTENTION_DAYS,
} from '../constants';

const CUSTOMER_SELECT = 'id, full_name, phone, email, notes, created_at';

const BOOKING_CUSTOMER_METRICS_SELECT =
  'customer_id, service_price_cents, addon_details, scheduled_date, start_time, status, created_at';

/**
 * @typedef {object} CustomerRow
 * @property {string} id
 * @property {string | null} full_name
 * @property {string | null} phone
 * @property {string | null} email
 * @property {string | null} notes
 * @property {string | null} created_at
 */

/**
 * @typedef {object} CustomerCardModel
 * @property {string} id
 * @property {string} name
 * @property {'new' | 'returning' | 'due'} status
 * @property {number} totalVisits
 * @property {number} totalSpent
 * @property {string | null} nextAppointmentDate
 * @property {number | null} nextAppointmentDaysUntil
 * @property {string | null} lastVisitDate
 * @property {number | null} lastVisitDaysAgo
 * @property {string} segment
 * @property {string} fullName
 * @property {string} pastVisitsSummary
 * @property {string} scheduleLabel
 * @property {string} nextAppointmentDateLabel
 * @property {string} nextAppointmentRelativeLabel
 */

/**
 * @param {string} businessId
 */
export async function fetchCustomersForBusiness(businessId) {
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * @param {string} businessId
 */
export async function fetchCustomerBookingsForBusiness(businessId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_CUSTOMER_METRICS_SELECT)
    .eq('business_id', businessId)
    .not('customer_id', 'is', null)
    .not('status', 'in', '("cancelled","canceled")');

  return { data, error };
}

/**
 * @param {string} businessId
 * @param {string} customerId
 */
export async function fetchCustomerForBusiness(businessId, customerId) {
  const { data, error } = await supabase
    .from('customers')
    .select(CUSTOMER_SELECT)
    .eq('business_id', businessId)
    .eq('id', customerId)
    .maybeSingle();

  return { data, error };
}

/**
 * Non-cancelled bookings for one customer (same select + status filter as list metrics).
 * @param {string} businessId
 * @param {string} customerId
 */
export async function fetchBookingsForCustomerMetrics(businessId, customerId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_CUSTOMER_METRICS_SELECT)
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .not('status', 'in', '("cancelled","canceled")');

  return { data, error };
}

/**
 * Removes a customer from CRM for a business.
 * First detaches `bookings.customer_id` to avoid FK failures, then deletes the customer row.
 *
 * @param {string} businessId
 * @param {string} customerId
 */
export async function removeCustomerForBusiness(businessId, customerId) {
  const { error: detachError } = await supabase
    .from('bookings')
    .update({ customer_id: null })
    .eq('business_id', businessId)
    .eq('customer_id', customerId);
  if (detachError) {
    return { error: detachError };
  }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('business_id', businessId)
    .eq('id', customerId);

  return { error };
}

/**
 * Updates customer CRM notes.
 * @param {string} businessId
 * @param {string} customerId
 * @param {string} notes
 */
export async function updateCustomerNotesForBusiness(businessId, customerId, notes) {
  const { data, error } = await supabase
    .from('customers')
    .update({ notes })
    .eq('business_id', businessId)
    .eq('id', customerId)
    .select(CUSTOMER_SELECT)
    .maybeSingle();

  return { data, error };
}

function centsFromAddonDetails(addonDetails) {
  if (!addonDetails) {
    return 0;
  }

  const asObject = typeof addonDetails === 'string' ? safeJsonParse(addonDetails) : addonDetails;
  if (!asObject) {
    return 0;
  }

  if (Array.isArray(asObject)) {
    return asObject.reduce(
      (sum, item) => sum + numberOrZero(item?.priceCents ?? item?.price_cents),
      0,
    );
  }

  if (Array.isArray(asObject.items)) {
    return asObject.items.reduce(
      (sum, item) => sum + numberOrZero(item?.priceCents ?? item?.price_cents),
      0,
    );
  }

  if (Array.isArray(asObject.addons)) {
    return asObject.addons.reduce(
      (sum, item) => sum + numberOrZero(item?.priceCents ?? item?.price_cents),
      0,
    );
  }

  return numberOrZero(asObject.priceCents ?? asObject.price_cents);
}

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

function formatLongDate(ms) {
  if (!Number.isFinite(ms)) {
    return '';
  }
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function diffCalendarDays(targetMs, nowMs) {
  if (!Number.isFinite(targetMs)) {
    return null;
  }
  const startNow = new Date(nowMs);
  startNow.setHours(0, 0, 0, 0);
  const startTarget = new Date(targetMs);
  startTarget.setHours(0, 0, 0, 0);
  return Math.round((startTarget.getTime() - startNow.getTime()) / 86400000);
}

function createEmptyBookingMetrics() {
  return { totalVisits: 0, totalSpent: 0, lastVisitMs: null, nextAppointmentMs: null };
}

/**
 * Mutates `acc`. Parity with web: completed/complete → visits, spend, latest last visit by
 * `scheduled_date` + `start_time` (local); confirmed in the future → next slot; cancelled rows
 * must be excluded before calling (see fetch helpers).
 *
 * @param {{ totalVisits: number; totalSpent: number; lastVisitMs: number | null; nextAppointmentMs: number | null }} acc
 * @param {Record<string, unknown>} booking
 * @param {number} nowMs
 */
function applyBookingToCustomerMetrics(acc, booking, nowMs) {
  const status = String(booking?.status ?? '').toLowerCase();
  const startMs = parseBookingStartLocalMs(booking?.scheduled_date, booking?.start_time);

  if ((status === 'completed' || status === 'complete') && Number.isFinite(startMs)) {
    acc.totalVisits += 1;
    const baseCents = numberOrZero(booking?.service_price_cents);
    const addonCents = centsFromAddonDetails(booking?.addon_details);
    acc.totalSpent += baseCents + addonCents;

    if (acc.lastVisitMs == null || startMs > acc.lastVisitMs) {
      acc.lastVisitMs = startMs;
    }
  }

  if (status === 'confirmed' && Number.isFinite(startMs) && startMs >= nowMs) {
    if (acc.nextAppointmentMs == null || startMs < acc.nextAppointmentMs) {
      acc.nextAppointmentMs = startMs;
    }
  }
}

/**
 * @param {Array<Record<string, unknown>> | null | undefined} bookings
 * @param {number} [nowMs]
 * @returns {Map<string, { totalVisits: number; totalSpent: number; lastVisitMs: number | null; nextAppointmentMs: number | null }>}
 */
export function aggregateBookingsPerCustomerMap(bookings, nowMs = Date.now()) {
  const byCustomerId = new Map();
  for (const booking of bookings ?? []) {
    const customerId = booking?.customer_id;
    if (!customerId) {
      continue;
    }
    if (!byCustomerId.has(customerId)) {
      byCustomerId.set(customerId, createEmptyBookingMetrics());
    }
    applyBookingToCustomerMetrics(byCustomerId.get(customerId), booking, nowMs);
  }
  return byCustomerId;
}

/**
 * Same rules as {@link aggregateBookingsPerCustomerMap} for bookings that all belong to one customer.
 * @param {Array<Record<string, unknown>> | null | undefined} bookings
 * @param {number} [nowMs]
 */
export function aggregateCustomerBookingMetrics(bookings, nowMs = Date.now()) {
  const acc = createEmptyBookingMetrics();
  for (const booking of bookings ?? []) {
    applyBookingToCustomerMetrics(acc, booking, nowMs);
  }
  return acc;
}

/**
 * @param {{ totalVisits: number; totalSpent: number; lastVisitMs: number | null; nextAppointmentMs: number | null }} metrics
 * @param {number} [nowMs]
 * @returns {{ segment: string; lastDays: number | null }}
 */
export function deriveCustomerStatusAndLastDays(metrics, nowMs = Date.now()) {
  const lifecycle = metrics.totalVisits > 1 ? CUSTOMER_FILTER_RETURNING : CUSTOMER_FILTER_NEW;
  const lastDays =
    metrics.lastVisitMs == null ? null : Math.abs(diffCalendarDays(metrics.lastVisitMs, nowMs));
  const needsAttention =
    metrics.nextAppointmentMs == null && lastDays != null && lastDays > NEEDS_ATTENTION_DAYS;
  const segment = needsAttention ? CUSTOMER_FILTER_DUE : lifecycle;
  return { segment, lastDays };
}

/**
 * @param {CustomerRow[] | null | undefined} customers
 * @param {Array<any> | null | undefined} bookings
 * @param {number} [nowMs]
 * @returns {CustomerCardModel[]}
 */
export function buildCustomerCards(customers, bookings, nowMs = Date.now()) {
  const byCustomerId = aggregateBookingsPerCustomerMap(bookings, nowMs);

  return (customers ?? []).map((row) => {
    const metrics = byCustomerId.get(row.id) ?? createEmptyBookingMetrics();

    const { segment: status, lastDays } = deriveCustomerStatusAndLastDays(metrics, nowMs);
    const nextDays =
      metrics.nextAppointmentMs == null ? null : diffCalendarDays(metrics.nextAppointmentMs, nowMs);

    let scheduleLabel = 'No schedule yet';
    let dateLabel = '';
    let relativeLabel = '';

    if (metrics.nextAppointmentMs != null) {
      scheduleLabel = 'Next appointment';
      dateLabel = formatLongDate(metrics.nextAppointmentMs);
      if (nextDays === 0) {
        relativeLabel = 'today';
      } else if ((nextDays ?? 0) > 0) {
        relativeLabel = `in ${nextDays} day${nextDays === 1 ? '' : 's'}`;
      }
    } else if (metrics.lastVisitMs != null) {
      scheduleLabel = 'Last visit';
      dateLabel = formatLongDate(metrics.lastVisitMs);
      relativeLabel = `${Math.max(0, lastDays ?? 0)}d ago`;
    }

    const totalVisits = metrics.totalVisits;
    const pastVisitsSummary =
      totalVisits === 0
        ? 'No past visits yet'
        : `${totalVisits} past visit${totalVisits === 1 ? '' : 's'}`;

    const displayName = row.full_name?.trim() || 'Customer';

    return {
      id: row.id,
      name: displayName,
      status,
      totalVisits: metrics.totalVisits,
      totalSpent: metrics.totalSpent,
      nextAppointmentDate:
        metrics.nextAppointmentMs == null
          ? null
          : new Date(metrics.nextAppointmentMs).toISOString(),
      nextAppointmentDaysUntil: nextDays,
      lastVisitDate:
        metrics.lastVisitMs == null ? null : new Date(metrics.lastVisitMs).toISOString(),
      lastVisitDaysAgo: lastDays,
      segment: status,
      fullName: displayName,
      pastVisitsSummary,
      scheduleLabel,
      nextAppointmentDateLabel: dateLabel,
      nextAppointmentRelativeLabel: relativeLabel,
    };
  });
}
