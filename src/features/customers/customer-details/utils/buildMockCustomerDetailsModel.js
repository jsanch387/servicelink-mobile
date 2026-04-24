import { CUSTOMER_FILTER_RETURNING } from '../../constants';
import { formatCustomerLastVisitDate } from './formatCustomerLastVisitDate';
import { formatDaysSinceLastVisit } from './formatDaysSinceLastVisit';

/** Placeholder link until the business booking URL comes from the API. */
export const MOCK_CUSTOMER_BOOKING_LINK = 'https://book.servicelink.app/demo-link';

function hashString(s) {
  return String(s)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function buildDemoEmailLocal(name) {
  const slug = String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return slug.length > 0 ? slug : 'customer';
}

/**
 * Preview model for the customer details UI. Replace with API-backed data later.
 * @param {{ customerId?: string; customerName?: string; customerSegment?: string } | undefined} routeParams
 */
export function buildMockCustomerDetailsModel(routeParams) {
  const customerId = routeParams?.customerId ?? 'demo';
  const fullName =
    typeof routeParams?.customerName === 'string' && routeParams.customerName.trim()
      ? routeParams.customerName.trim()
      : 'Alex Rivera';
  const segment = routeParams?.customerSegment ?? CUSTOMER_FILTER_RETURNING;
  const n = hashString(customerId);
  const visits = 5 + (n % 20);
  const spendCents = 120_000 + (n % 80) * 3_700;
  /** Rotate through long-month names in source data; display uses short month via formatter. */
  const lastVisitSources = [
    '2026-09-24T12:00:00.000Z',
    '2026-10-08T12:00:00.000Z',
    '2026-04-02T12:00:00.000Z',
    '2026-12-31T12:00:00.000Z',
    '2026-08-15T12:00:00.000Z',
  ];
  const lastVisitAt = new Date(lastVisitSources[n % lastVisitSources.length]);
  const lastVisitAtIso = lastVisitAt.toISOString();

  return {
    id: customerId,
    fullName,
    segment,
    phone: '(555) 201-4498',
    email: `${buildDemoEmailLocal(fullName)}@email.com`,
    totalSpendLabel: `$${Math.round(spendCents / 100).toLocaleString()}`,
    totalVisitsLabel: String(visits),
    lastVisitAtIso,
    lastVisitLabel: formatCustomerLastVisitDate(lastVisitAt),
    lastVisitRelativeLabel: formatDaysSinceLastVisit(lastVisitAt),
    ownerNotes:
      'Prefers morning slots. Interior was quite dirty last visit — good candidate for a deep clean upsell.\n\nGate code: #4821',
    bookingLink: MOCK_CUSTOMER_BOOKING_LINK,
  };
}
