/**
 * Design mock only — replace with API/Supabase when subscriptions ship.
 * Shapes here are the working data contract for UI + later backend.
 */

/** @typedef {'active' | 'past_due' | 'canceled'} SubscriptionStatus */

/**
 * @typedef {object} MockSubscriptionPlan
 * @property {string} id
 * @property {string} name
 * @property {string} serviceName
 * @property {number} priceCents
 * @property {'month' | 'year'} interval
 * @property {number} visitsPerPeriod
 * @property {boolean} isPublic
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
 * @property {string} currentPeriodEnd — YYYY-MM-DD
 * @property {boolean} cancelAtPeriodEnd
 * @property {string | null} lastPaymentFailedAt — ISO date or null
 * @property {string} manageLink — customer web manage URL (mock)
 * @property {string} startedAt — YYYY-MM-DD
 */

/** @type {MockSubscriptionPlan[]} */
export const MOCK_SUBSCRIPTION_PLANS = [
  {
    id: 'plan_monthly_wash',
    name: 'Monthly Wash',
    serviceName: 'Exterior Wash',
    priceCents: 10000,
    interval: 'month',
    visitsPerPeriod: 1,
    isPublic: true,
  },
  {
    id: 'plan_biweekly_detail',
    name: 'Keep It Clean',
    serviceName: 'Maintenance Detail',
    priceCents: 14900,
    interval: 'month',
    visitsPerPeriod: 2,
    isPublic: true,
  },
];

/** @type {MockSubscription[]} */
export const MOCK_SUBSCRIPTIONS = [
  {
    id: 'sub_mock_1',
    customerId: 'cust_mock_1',
    customerName: 'Jordan Lee',
    customerEmail: 'jordan@example.com',
    customerPhone: '(512) 555-0142',
    planId: 'plan_monthly_wash',
    planName: 'Monthly Wash',
    serviceName: 'Exterior Wash',
    priceCents: 10000,
    interval: 'month',
    status: 'active',
    preferredWeekday: 'Saturday',
    preferredTime: '10:00 AM',
    nextVisitDate: '2026-08-09',
    nextVisitTime: '10:00',
    lastVisitDate: '2026-07-12',
    currentPeriodEnd: '2026-09-05',
    cancelAtPeriodEnd: false,
    lastPaymentFailedAt: null,
    manageLink: 'https://myservicelink.app/demo-detail/memberships/manage/sub_mock_1',
    startedAt: '2026-03-05',
  },
  {
    id: 'sub_mock_2',
    customerId: 'cust_mock_2',
    customerName: 'Sam Rivera',
    customerEmail: 'sam.r@example.com',
    customerPhone: '(512) 555-0198',
    planId: 'plan_biweekly_detail',
    planName: 'Keep It Clean',
    serviceName: 'Maintenance Detail',
    priceCents: 14900,
    interval: 'month',
    status: 'past_due',
    preferredWeekday: 'Wednesday',
    preferredTime: '2:00 PM',
    nextVisitDate: null,
    nextVisitTime: null,
    lastVisitDate: '2026-07-16',
    currentPeriodEnd: '2026-08-01',
    cancelAtPeriodEnd: false,
    lastPaymentFailedAt: '2026-08-01',
    manageLink: 'https://myservicelink.app/demo-detail/memberships/manage/sub_mock_2',
    startedAt: '2026-01-12',
  },
  {
    id: 'sub_mock_3',
    customerId: 'cust_mock_3',
    customerName: 'Alex Morgan',
    customerEmail: '',
    customerPhone: '(737) 555-0110',
    planId: 'plan_monthly_wash',
    planName: 'Monthly Wash',
    serviceName: 'Exterior Wash',
    priceCents: 10000,
    interval: 'month',
    status: 'active',
    preferredWeekday: 'Friday',
    preferredTime: '9:00 AM',
    nextVisitDate: '2026-08-15',
    nextVisitTime: '09:00',
    lastVisitDate: '2026-07-18',
    currentPeriodEnd: '2026-08-20',
    cancelAtPeriodEnd: true,
    lastPaymentFailedAt: null,
    manageLink: 'https://myservicelink.app/demo-detail/memberships/manage/sub_mock_3',
    startedAt: '2025-11-20',
  },
  {
    id: 'sub_mock_4',
    customerId: 'cust_mock_4',
    customerName: 'Casey Nguyen',
    customerEmail: 'casey.n@example.com',
    customerPhone: '',
    planId: 'plan_monthly_wash',
    planName: 'Monthly Wash',
    serviceName: 'Exterior Wash',
    priceCents: 10000,
    interval: 'month',
    status: 'canceled',
    preferredWeekday: 'Monday',
    preferredTime: '11:00 AM',
    nextVisitDate: null,
    nextVisitTime: null,
    lastVisitDate: '2026-05-05',
    currentPeriodEnd: '2026-06-01',
    cancelAtPeriodEnd: false,
    lastPaymentFailedAt: null,
    manageLink: 'https://myservicelink.app/demo-detail/memberships/manage/sub_mock_4',
    startedAt: '2025-09-01',
  },
];

export const MOCK_MEMBERSHIPS_PUBLIC_LINK = 'https://myservicelink.app/demo-detail/memberships';
