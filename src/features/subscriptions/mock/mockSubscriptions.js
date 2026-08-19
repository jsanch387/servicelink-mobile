/**
 * Design mock only — replace with API/Supabase when subscriptions ship.
 * Shapes here are the working data contract for UI + later backend.
 */

import { cadenceKeyFromParts } from '../constants/planCadence';

/** @typedef {'active' | 'past_due' | 'canceled'} SubscriptionStatus */

/**
 * @typedef {object} MockOfferedSchedule
 * @property {string} cadenceKey
 * @property {number} count
 * @property {'week' | 'month'} interval
 * @property {number} priceCents
 */

/**
 * @typedef {object} MockSubscriptionPlan
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} serviceName
 * @property {number} priceCents — lowest offered price (hub cards)
 * @property {'month' | 'year'} interval
 * @property {number} visitsPerPeriod
 * @property {boolean} isPublic
 * @property {MockOfferedSchedule[]} [offeredSchedules]
 * @property {string[]} [offeredCadenceKeys]
 * @property {number} [subscriberCount]
 */

/**
 * @typedef {object} MockSubscription
 * @property {string} id
 * @property {string} customerId
 * @property {string} customerName
 * @property {string} [customerEmail]
 * @property {string} [customerPhone]
 * @property {string} planId
 * @property {string} planName
 * @property {string} serviceName
 * @property {number} priceCents
 * @property {'month' | 'year'} interval
 * @property {SubscriptionStatus} status
 * @property {string} preferredWeekday — e.g. Saturday
 * @property {string} preferredTime — e.g. 10:00 AM
 * @property {string | null} nextVisitDate — YYYY-MM-DD
 * @property {string | null} nextVisitTime — HH:mm
 * @property {string | null} lastVisitDate — YYYY-MM-DD
 * @property {string} currentPeriodEnd — YYYY-MM-DD (access / renew boundary)
 * @property {string | null} nextBillingDate — YYYY-MM-DD when the next charge is due
 * @property {boolean} cancelAtPeriodEnd
 * @property {string | null} lastPaymentAt — YYYY-MM-DD of last successful charge
 * @property {number | null} lastPaymentAmountCents
 * @property {string | null} lastPaymentFailedAt — ISO date or null
 * @property {string} manageLink — Stripe / customer billing portal URL (mock)
 * @property {string} startedAt — YYYY-MM-DD
 */

/**
 * When true (and `__DEV__`), Subscriptions opens the live hub with seeded plans
 * so plan detail / member list can be designed without gating or create-plan.
 */
export const SEED_SUBSCRIPTIONS_HUB_FOR_DESIGN = false;

/**
 * @param {number} count
 * @param {'week' | 'month'} interval
 * @param {number} priceCents
 * @returns {MockOfferedSchedule}
 */
function schedule(count, interval, priceCents) {
  return {
    cadenceKey: cadenceKeyFromParts(count, interval),
    count,
    interval,
    priceCents,
  };
}

/** @type {MockSubscriptionPlan[]} */
export const MOCK_SUBSCRIPTION_PLANS = [
  {
    id: 'plan_monthly_wash',
    name: 'Monthly Wash',
    description:
      'Exterior wash on a recurring schedule. Includes wheels, tire shine, and a quick interior wipe-down. Perfect for customers who want their car looking fresh without booking every time.',
    serviceName: 'Exterior Wash',
    offeredSchedules: [
      schedule(1, 'week', 4500),
      schedule(2, 'week', 7500),
      schedule(1, 'month', 10000),
    ],
    priceCents: 4500,
    interval: 'month',
    visitsPerPeriod: 1,
    isPublic: true,
    subscriberCount: 12,
  },
  {
    id: 'plan_biweekly_detail',
    name: 'Keep It Clean',
    description:
      'Maintenance detail every other week — interior vacuum, exterior wash, and glass. Built for busy owners who want consistent results.',
    serviceName: 'Maintenance Detail',
    offeredSchedules: [schedule(2, 'week', 14900), schedule(1, 'month', 19900)],
    priceCents: 14900,
    interval: 'month',
    visitsPerPeriod: 2,
    isPublic: true,
    subscriberCount: 4,
  },
  {
    id: 'plan_interior_refresh',
    name: 'Interior Refresh',
    description: 'Monthly deep interior clean — carpets, seats, vents, and odor treatment.',
    serviceName: 'Interior Detail',
    offeredSchedules: [schedule(1, 'month', 12900)],
    priceCents: 12900,
    interval: 'month',
    visitsPerPeriod: 1,
    isPublic: true,
    subscriberCount: 2,
  },
];

/**
 * @param {Partial<MockSubscription> & Pick<MockSubscription, 'id' | 'customerId' | 'customerName' | 'planId' | 'status'>} partial
 * @returns {MockSubscription}
 */
function sub(partial) {
  const plan = MOCK_SUBSCRIPTION_PLANS.find((row) => row.id === partial.planId);
  const priceCents = partial.priceCents ?? plan?.priceCents ?? 10000;
  return {
    customerEmail: '',
    customerPhone: '',
    planName: plan?.name ?? 'Plan',
    serviceName: plan?.serviceName ?? 'Service',
    priceCents,
    interval: 'month',
    preferredWeekday: 'Saturday',
    preferredTime: '10:00 AM',
    nextVisitDate:
      partial.status === 'canceled' || partial.status === 'past_due' ? null : '2026-08-16',
    nextVisitTime: partial.status === 'canceled' || partial.status === 'past_due' ? null : '10:00',
    lastVisitDate: '2026-07-12',
    currentPeriodEnd: '2026-09-05',
    nextBillingDate: partial.status === 'canceled' ? null : '2026-09-05',
    cancelAtPeriodEnd: false,
    lastPaymentAt: '2026-08-05',
    lastPaymentAmountCents: priceCents,
    lastPaymentFailedAt: partial.status === 'past_due' ? '2026-08-01' : null,
    manageLink: `https://myservicelink.app/demo-detail/memberships/manage/${partial.id}`,
    startedAt: '2026-03-05',
    ...partial,
  };
}

/** @type {MockSubscription[]} */
export const MOCK_SUBSCRIPTIONS = [
  // Monthly Wash — enough members to exercise “Show all”
  sub({
    id: 'sub_mock_1',
    customerId: 'cust_mock_1',
    customerName: 'Jordan Lee',
    customerEmail: 'jordan@example.com',
    customerPhone: '(512) 555-0142',
    planId: 'plan_monthly_wash',
    priceCents: 10000,
    status: 'active',
    preferredWeekday: 'Saturday',
    preferredTime: '10:00 AM',
    nextVisitDate: '2026-08-09',
    nextVisitTime: '10:00',
    startedAt: '2026-03-05',
  }),
  sub({
    id: 'sub_mock_3',
    customerId: 'cust_mock_3',
    customerName: 'Alex Morgan',
    customerPhone: '(737) 555-0110',
    planId: 'plan_monthly_wash',
    priceCents: 10000,
    status: 'active',
    preferredWeekday: 'Friday',
    preferredTime: '9:00 AM',
    nextVisitDate: '2026-08-15',
    nextVisitTime: '09:00',
    currentPeriodEnd: '2026-08-20',
    nextBillingDate: null,
    cancelAtPeriodEnd: true,
    lastPaymentAt: '2026-07-20',
    startedAt: '2025-11-20',
  }),
  sub({
    id: 'sub_mock_4',
    customerId: 'cust_mock_4',
    customerName: 'Casey Nguyen',
    customerEmail: 'casey.n@example.com',
    planId: 'plan_monthly_wash',
    priceCents: 10000,
    status: 'canceled',
    preferredWeekday: 'Monday',
    preferredTime: '11:00 AM',
    lastVisitDate: '2026-05-05',
    currentPeriodEnd: '2026-06-01',
    nextBillingDate: null,
    lastPaymentAt: '2026-05-01',
    startedAt: '2025-09-01',
  }),
  sub({
    id: 'sub_wash_5',
    customerId: 'cust_wash_5',
    customerName: 'Riley Chen',
    planId: 'plan_monthly_wash',
    priceCents: 4500,
    status: 'active',
    // No next visit — exercises “Book a visit” CTA on subscriber detail
    nextVisitDate: null,
    nextVisitTime: null,
  }),
  sub({
    id: 'sub_wash_6',
    customerId: 'cust_wash_6',
    customerName: 'Morgan Blake',
    planId: 'plan_monthly_wash',
    priceCents: 7500,
    status: 'active',
    nextVisitDate: '2026-08-11',
  }),
  sub({
    id: 'sub_wash_7',
    customerId: 'cust_wash_7',
    customerName: 'Taylor Quinn',
    planId: 'plan_monthly_wash',
    priceCents: 10000,
    status: 'past_due',
    lastPaymentFailedAt: '2026-08-01',
  }),
  sub({
    id: 'sub_wash_8',
    customerId: 'cust_wash_8',
    customerName: 'Avery Brooks',
    planId: 'plan_monthly_wash',
    priceCents: 4500,
    status: 'active',
    nextVisitDate: '2026-08-12',
  }),
  sub({
    id: 'sub_wash_9',
    customerId: 'cust_wash_9',
    customerName: 'Cameron Diaz',
    planId: 'plan_monthly_wash',
    priceCents: 10000,
    status: 'active',
    nextVisitDate: '2026-08-13',
  }),
  sub({
    id: 'sub_wash_10',
    customerId: 'cust_wash_10',
    customerName: 'Jamie Ortiz',
    planId: 'plan_monthly_wash',
    priceCents: 7500,
    status: 'active',
    nextVisitDate: '2026-08-14',
  }),
  sub({
    id: 'sub_wash_11',
    customerId: 'cust_wash_11',
    customerName: 'Reese Patel',
    planId: 'plan_monthly_wash',
    priceCents: 10000,
    status: 'active',
    nextVisitDate: '2026-08-17',
  }),
  sub({
    id: 'sub_wash_12',
    customerId: 'cust_wash_12',
    customerName: 'Drew Kim',
    planId: 'plan_monthly_wash',
    priceCents: 4500,
    status: 'active',
    nextVisitDate: '2026-08-18',
  }),
  sub({
    id: 'sub_wash_13',
    customerId: 'cust_wash_13',
    customerName: 'Parker Wells',
    planId: 'plan_monthly_wash',
    priceCents: 10000,
    status: 'active',
    nextVisitDate: '2026-08-19',
  }),
  sub({
    id: 'sub_wash_14',
    customerId: 'cust_wash_14',
    customerName: 'Quinn Harper',
    planId: 'plan_monthly_wash',
    priceCents: 7500,
    status: 'past_due',
  }),

  // Keep It Clean
  sub({
    id: 'sub_mock_2',
    customerId: 'cust_mock_2',
    customerName: 'Sam Rivera',
    customerEmail: 'sam.r@example.com',
    customerPhone: '(512) 555-0198',
    planId: 'plan_biweekly_detail',
    priceCents: 14900,
    status: 'past_due',
    preferredWeekday: 'Wednesday',
    preferredTime: '2:00 PM',
    lastVisitDate: '2026-07-16',
    currentPeriodEnd: '2026-08-01',
    nextBillingDate: '2026-08-01',
    lastPaymentAt: '2026-07-01',
    lastPaymentFailedAt: '2026-08-01',
    startedAt: '2026-01-12',
  }),
  sub({
    id: 'sub_detail_2',
    customerId: 'cust_detail_2',
    customerName: 'Hayden Scott',
    planId: 'plan_biweekly_detail',
    priceCents: 14900,
    status: 'active',
    nextVisitDate: '2026-08-20',
  }),
  sub({
    id: 'sub_detail_3',
    customerId: 'cust_detail_3',
    customerName: 'Skyler James',
    planId: 'plan_biweekly_detail',
    priceCents: 19900,
    status: 'active',
    nextVisitDate: '2026-08-21',
  }),
  sub({
    id: 'sub_detail_4',
    customerId: 'cust_detail_4',
    customerName: 'Emerson Cruz',
    planId: 'plan_biweekly_detail',
    priceCents: 14900,
    status: 'canceled',
    lastVisitDate: '2026-06-01',
    currentPeriodEnd: '2026-06-15',
  }),

  // Interior Refresh
  sub({
    id: 'sub_interior_1',
    customerId: 'cust_interior_1',
    customerName: 'Finley Shaw',
    planId: 'plan_interior_refresh',
    priceCents: 12900,
    status: 'active',
    nextVisitDate: '2026-08-22',
  }),
  sub({
    id: 'sub_interior_2',
    customerId: 'cust_interior_2',
    customerName: 'Rowan Ellis',
    planId: 'plan_interior_refresh',
    priceCents: 12900,
    status: 'active',
    nextVisitDate: '2026-08-23',
  }),
];

export const MOCK_MEMBERSHIPS_PUBLIC_LINK = 'https://myservicelink.app/demo-detail/memberships';

/** Plans shaped for the live hub / plan detail (includes counts from MOCK_SUBSCRIPTIONS). */
export function getMockHubPlans() {
  return MOCK_SUBSCRIPTION_PLANS.map((plan) => {
    const offeredSchedules = plan.offeredSchedules ?? [];
    const subscriberCount = MOCK_SUBSCRIPTIONS.filter(
      (row) => row.planId === plan.id && row.status !== 'canceled',
    ).length;
    return {
      ...plan,
      offeredSchedules,
      offeredCadenceKeys: offeredSchedules.map((row) => row.cadenceKey),
      subscriberCount,
    };
  });
}
