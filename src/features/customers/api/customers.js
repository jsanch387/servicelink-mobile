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

/**
 * @param {CustomerRow[] | null | undefined} customers
 * @param {Array<any> | null | undefined} bookings
 * @param {number} [nowMs]
 * @returns {CustomerCardModel[]}
 */
export function buildCustomerCards(customers, bookings, nowMs = Date.now()) {
  const byCustomerId = new Map();

  for (const booking of bookings ?? []) {
    const customerId = booking?.customer_id;
    if (!customerId) {
      continue;
    }
    const status = String(booking?.status ?? '').toLowerCase();
    const startMs = parseBookingStartLocalMs(booking?.scheduled_date, booking?.start_time);

    if (!byCustomerId.has(customerId)) {
      byCustomerId.set(customerId, {
        totalVisits: 0,
        totalSpent: 0,
        lastVisitMs: null,
        nextAppointmentMs: null,
      });
    }

    const acc = byCustomerId.get(customerId);

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

  return (customers ?? []).map((row) => {
    const metrics = byCustomerId.get(row.id) ?? {
      totalVisits: 0,
      totalSpent: 0,
      lastVisitMs: null,
      nextAppointmentMs: null,
    };

    const lifecycle = metrics.totalVisits > 1 ? CUSTOMER_FILTER_RETURNING : CUSTOMER_FILTER_NEW;
    const nextDays =
      metrics.nextAppointmentMs == null ? null : diffCalendarDays(metrics.nextAppointmentMs, nowMs);
    const lastDays =
      metrics.lastVisitMs == null ? null : Math.abs(diffCalendarDays(metrics.lastVisitMs, nowMs));

    const needsAttention =
      metrics.nextAppointmentMs == null && lastDays != null && lastDays > NEEDS_ATTENTION_DAYS;
    const status = needsAttention ? CUSTOMER_FILTER_DUE : lifecycle;

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
      if ((lastDays ?? 0) > 0) {
        relativeLabel = `${lastDays} day${lastDays === 1 ? '' : 's'} ago`;
      } else {
        relativeLabel = 'today';
      }
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
