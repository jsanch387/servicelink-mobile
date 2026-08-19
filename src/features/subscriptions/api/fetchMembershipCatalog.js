import { supabase } from '../../../lib/supabase';
import {
  mapMembershipPlan,
  mapMembershipSubscriber,
  mapPlanPriceRow,
} from '../utils/mapMembershipModels';

const PLAN_SELECT =
  'id, business_id, name, description, is_published, is_popular, sort_order, visit_duration_minutes, deleted_at, created_at, updated_at';

const PRICE_SELECT =
  'id, plan_id, business_id, interval_unit, interval_count, price_cents, currency, is_default, created_at';

const MEMBERSHIP_SELECT =
  'id, business_id, plan_id, plan_price_id, customer_id, customer_name, customer_email, customer_phone, status, amount_cents, currency, interval_unit, interval_count, current_period_start, current_period_end, cancel_at_period_end, cancel_at, canceled_at, ended_at, last_invoice_status, payment_method_brand, payment_method_last4, notes, initial_booking_id, period_visit_booking_id, period_visit_period_start, created_at';

const BOOKING_SELECT = 'id, scheduled_date, start_time, status';

/**
 * Load plans + prices + subscribers for an owner business.
 * @param {string} businessId
 * @returns {Promise<{
 *   plans: ReturnType<typeof mapMembershipPlan>[];
 *   subscribers: ReturnType<typeof mapMembershipSubscriber>[];
 *   error: Error | null;
 * }>}
 */
export async function fetchMembershipCatalog(businessId) {
  const bid = String(businessId ?? '').trim();
  if (!bid) {
    return { plans: [], subscribers: [], error: new Error('Missing business') };
  }

  const [plansRes, pricesRes, membersRes] = await Promise.all([
    supabase
      .from('membership_plans')
      .select(PLAN_SELECT)
      .eq('business_id', bid)
      .is('deleted_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase.from('membership_plan_prices').select(PRICE_SELECT).eq('business_id', bid),
    supabase
      .from('customer_memberships')
      .select(MEMBERSHIP_SELECT)
      .eq('business_id', bid)
      .order('created_at', { ascending: false }),
  ]);

  if (plansRes.error) {
    return { plans: [], subscribers: [], error: plansRes.error };
  }
  if (pricesRes.error) {
    return { plans: [], subscribers: [], error: pricesRes.error };
  }
  if (membersRes.error) {
    return { plans: [], subscribers: [], error: membersRes.error };
  }

  const livePlans = Array.isArray(plansRes.data) ? plansRes.data : [];
  const priceRows = Array.isArray(pricesRes.data) ? pricesRes.data : [];
  const memberRows = Array.isArray(membersRes.data) ? membersRes.data : [];

  /** Soft-deleted plans referenced by memberships (names + planRemoved for detail copy). */
  const livePlanIds = new Set(livePlans.map((p) => String(p.id)));
  const neededPlanIds = [
    ...new Set(
      memberRows
        .map((m) => (m.plan_id != null ? String(m.plan_id) : ''))
        .filter((id) => id && !livePlanIds.has(id)),
    ),
  ];

  /** @type {Record<string, unknown>[]} */
  let deletedPlans = [];
  if (neededPlanIds.length > 0) {
    const deletedRes = await supabase
      .from('membership_plans')
      .select(PLAN_SELECT)
      .eq('business_id', bid)
      .in('id', neededPlanIds);
    if (deletedRes.error) {
      return { plans: [], subscribers: [], error: deletedRes.error };
    }
    deletedPlans = Array.isArray(deletedRes.data) ? deletedRes.data : [];
  }

  const planById = new Map();
  for (const row of livePlans) planById.set(String(row.id), row);
  for (const row of deletedPlans) planById.set(String(row.id), row);

  const bookingIds = [
    ...new Set(
      memberRows
        .map((m) => (m.period_visit_booking_id != null ? String(m.period_visit_booking_id) : ''))
        .filter(Boolean),
    ),
  ];

  /** @type {Map<string, Record<string, unknown>>} */
  const bookingById = new Map();
  if (bookingIds.length > 0) {
    const bookingsRes = await supabase
      .from('bookings')
      .select(BOOKING_SELECT)
      .eq('business_id', bid)
      .in('id', bookingIds);
    if (bookingsRes.error) {
      return { plans: [], subscribers: [], error: bookingsRes.error };
    }
    for (const row of bookingsRes.data ?? []) {
      bookingById.set(String(row.id), row);
    }
  }

  const subscribers = memberRows.map((row) => {
    const planId = row.plan_id != null ? String(row.plan_id) : '';
    const bookingId =
      row.period_visit_booking_id != null ? String(row.period_visit_booking_id) : '';
    return mapMembershipSubscriber({
      row,
      plan: planId ? (planById.get(planId) ?? null) : null,
      booking: bookingId ? (bookingById.get(bookingId) ?? null) : null,
    });
  });

  /** @type {Map<string, typeof subscribers>} */
  const activeByPlan = new Map();
  for (const sub of subscribers) {
    if (!sub.isActiveList || !sub.planId) continue;
    const list = activeByPlan.get(sub.planId) ?? [];
    list.push(sub);
    activeByPlan.set(sub.planId, list);
  }

  /** @type {Map<string, ReturnType<typeof mapPlanPriceRow>[]>} */
  const pricesByPlan = new Map();
  for (const priceRow of priceRows) {
    const planId = String(priceRow.plan_id ?? '');
    if (!planId) continue;
    const mapped = mapPlanPriceRow(priceRow);
    const list = pricesByPlan.get(planId) ?? [];
    list.push(mapped);
    pricesByPlan.set(planId, list);
  }

  const plans = livePlans.map((planRow) => {
    const id = String(planRow.id);
    return mapMembershipPlan(
      planRow,
      pricesByPlan.get(id) ?? [],
      activeByPlan.get(id)?.length ?? 0,
    );
  });

  return { plans, subscribers, error: null };
}

/**
 * @param {string} businessId
 * @param {string} subscriberId
 */
export async function fetchMembershipSubscriberById(businessId, subscriberId) {
  const { subscribers, error } = await fetchMembershipCatalog(businessId);
  if (error) return { subscriber: null, error };
  const id = String(subscriberId ?? '').trim();
  return {
    subscriber: subscribers.find((row) => row.id === id) ?? null,
    error: null,
  };
}
