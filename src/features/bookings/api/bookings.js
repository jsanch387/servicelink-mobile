import { supabase } from '../../../lib/supabase';
import { localYyyyMmDd, parseBookingStartLocalMs } from '../../home/utils/bookingStart';

/**
 * @typedef {object} BookingRow
 * @property {string} id
 * @property {string} scheduled_date
 * @property {string} start_time
 * @property {string} status
 * @property {string | null} service_name
 * @property {string | null} customer_name
 * @property {string | null} customer_phone
 * @property {string | null} customer_street_address
 * @property {string | null} customer_unit_apt
 * @property {string | null} customer_city
 * @property {string | null} customer_state
 * @property {string | null} customer_zip
 * @property {string | null} customer_vehicle_year
 * @property {string | null} customer_vehicle_make
 * @property {string | null} customer_vehicle_model
 * @property {number | null} [duration_minutes]
 */

/** Keep in sync with `formatBookingAddressForMaps` in `home/utils/bookingAddress.js`. */
export const BOOKING_LIST_SELECT =
  'id, scheduled_date, start_time, status, service_name, customer_name, customer_phone, customer_street_address, customer_unit_apt, customer_city, customer_state, customer_zip, customer_vehicle_year, customer_vehicle_make, customer_vehicle_model';

/** Planner day view — includes duration for timeline height. */
export const PLANNER_BOOKING_SELECT = `${BOOKING_LIST_SELECT}, duration_minutes`;

/**
 * Confirmed bookings from today onward (calendar date); filter to true “upcoming” instants in JS.
 *
 * @param {string} businessId
 * @returns {Promise<{ data: BookingRow[] | null, error: Error | null }>}
 */
export async function fetchConfirmedBookingsFromToday(businessId) {
  const today = localYyyyMmDd();

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_LIST_SELECT)
    .eq('business_id', businessId)
    .eq('status', 'confirmed')
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true });

  return { data, error };
}

const PAST_LIST_LIMIT = 250;
const CANCELLED_LIST_LIMIT = 250;

/** Statuses shown on the Past tab (excludes cancelled — those use the Cancelled filter). */
const PAST_LIST_STATUSES = ['confirmed', 'completed', 'complete'];

function isPastListStatus(status) {
  const s = String(status ?? '').toLowerCase();
  return PAST_LIST_STATUSES.includes(s);
}

/**
 * Confirmed past appointments: calendar days before today (capped) plus **all** of today’s rows.
 * Split avoids a single `lte(today) + limit` query filling the limit with “today, late times” so
 * yesterday’s (and older) past bookings never load — which made the Past tab look empty.
 * Includes **completed** visits (many DBs move past appointments off `confirmed`).
 * Client filters to instants strictly before `nowMs` via `filterPastConfirmedRows`.
 *
 * @param {string} businessId
 * @returns {Promise<{ data: BookingRow[] | null, error: Error | null }>}
 */
export async function fetchPastConfirmedBookingsForBusiness(businessId) {
  const today = localYyyyMmDd();

  const priorPromise = supabase
    .from('bookings')
    .select(BOOKING_LIST_SELECT)
    .eq('business_id', businessId)
    .in('status', PAST_LIST_STATUSES)
    .lt('scheduled_date', today)
    .order('scheduled_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(PAST_LIST_LIMIT);

  const todayPromise = supabase
    .from('bookings')
    .select(BOOKING_LIST_SELECT)
    .eq('business_id', businessId)
    .in('status', PAST_LIST_STATUSES)
    .eq('scheduled_date', today);

  const [{ data: priorRows, error: priorError }, { data: todayRows, error: todayError }] =
    await Promise.all([priorPromise, todayPromise]);

  const error = priorError ?? todayError;
  const merged = [...(todayRows ?? []), ...(priorRows ?? [])];

  return { data: merged, error };
}

/**
 * All bookings on a calendar day (any status) for the day planner.
 *
 * @param {string} businessId
 * @param {string} yyyyMmDd - local calendar date `YYYY-MM-DD`
 * @returns {Promise<{ data: BookingRow[] | null, error: Error | null }>}
 */
export async function fetchBookingsForPlannerDay(businessId, yyyyMmDd) {
  const { data, error } = await supabase
    .from('bookings')
    .select(PLANNER_BOOKING_SELECT)
    .eq('business_id', businessId)
    .eq('scheduled_date', yyyyMmDd)
    .order('start_time', { ascending: true });

  return { data, error };
}

/**
 * @param {BookingRow[] | null | undefined} rows
 * @param {number} nowMs
 * @returns {BookingRow[]}
 */
export function filterPastConfirmedRows(rows, nowMs) {
  const out = [];
  for (const row of rows ?? []) {
    if (!isPastListStatus(row.status)) {
      continue;
    }
    const ms = parseBookingStartLocalMs(row.scheduled_date, row.start_time);
    if (!Number.isFinite(ms) || ms >= nowMs) {
      continue;
    }
    out.push(row);
  }
  out.sort((a, b) => {
    const mb = parseBookingStartLocalMs(b.scheduled_date, b.start_time);
    const ma = parseBookingStartLocalMs(a.scheduled_date, a.start_time);
    return mb - ma;
  });
  return out;
}

/**
 * Cancelled rows, most recently scheduled first (for quick glance at latest changes).
 *
 * @param {string} businessId
 * @returns {Promise<{ data: BookingRow[] | null, error: Error | null }>}
 */
export async function fetchCancelledBookingsForBusiness(businessId) {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_LIST_SELECT)
    .eq('business_id', businessId)
    .in('status', ['cancelled', 'canceled'])
    .order('scheduled_date', { ascending: false })
    .order('start_time', { ascending: false })
    .limit(CANCELLED_LIST_LIMIT);

  return { data, error };
}

/**
 * @param {BookingRow[] | null | undefined} rows
 * @returns {BookingRow[]}
 */
export function sortCancelledBookingsForList(rows) {
  const list = [...(rows ?? [])];
  list.sort((a, b) => {
    const mb = parseBookingStartLocalMs(b.scheduled_date, b.start_time);
    const ma = parseBookingStartLocalMs(a.scheduled_date, a.start_time);
    return mb - ma;
  });
  return list;
}

/**
 * @param {BookingRow[]} rows
 * @param {number} nowMs
 * @returns {{ upcoming: BookingRow[]; next: BookingRow | null }}
 */
export function partitionUpcomingConfirmed(rows, nowMs) {
  const upcoming = [];
  for (const row of rows) {
    if (row.status !== 'confirmed') {
      continue;
    }
    const ms = parseBookingStartLocalMs(row.scheduled_date, row.start_time);
    if (!Number.isFinite(ms) || ms < nowMs) {
      continue;
    }
    upcoming.push(row);
  }
  upcoming.sort((a, b) => {
    const ma = parseBookingStartLocalMs(a.scheduled_date, a.start_time);
    const mb = parseBookingStartLocalMs(b.scheduled_date, b.start_time);
    return ma - mb;
  });
  return {
    upcoming,
    next: upcoming[0] ?? null,
  };
}

export function bookingTitleLine(booking) {
  const name = booking.customer_name?.trim() || 'Customer';
  const service = booking.service_name?.trim() || 'Service';
  return `${name} — ${service}`;
}
