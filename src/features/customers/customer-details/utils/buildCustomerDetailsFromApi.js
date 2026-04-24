import {
  aggregateCustomerBookingMetrics,
  deriveCustomerStatusAndLastDays,
} from '../../api/customers';
import { formatCustomerLastVisitDate } from './formatCustomerLastVisitDate';
import { formatDaysSinceLastVisitCompact } from './formatDaysSinceLastVisit';

/**
 * Detail-screen model from `customers` row + that customer's bookings (non-cancelled).
 * Stats match `buildCustomerCards` / web aggregate: completed → visits, spend, last visit
 * by `scheduled_date` + `start_time` (local parse); confirmed future → segment / due rules.
 *
 * @param {{ id: string; full_name?: string | null; phone?: string | null; email?: string | null; notes?: string | null }} customerRow
 * @param {Array<Record<string, unknown>>} bookings
 * @param {number} [nowMs]
 */
export function buildCustomerDetailsFromApi(customerRow, bookings, nowMs = Date.now()) {
  const metrics = aggregateCustomerBookingMetrics(bookings, nowMs);
  const { segment } = deriveCustomerStatusAndLastDays(metrics, nowMs);
  const fullName = customerRow.full_name?.trim() || 'Customer';
  const spendCents = metrics.totalSpent;
  const lastVisitAt = metrics.lastVisitMs == null ? null : new Date(metrics.lastVisitMs);

  return {
    id: customerRow.id,
    fullName,
    segment,
    phone: customerRow.phone ?? '',
    email: customerRow.email ?? '',
    totalSpendLabel: `$${Math.round(spendCents / 100).toLocaleString()}`,
    totalVisitsLabel: String(metrics.totalVisits),
    lastVisitAtIso: lastVisitAt ? lastVisitAt.toISOString() : '',
    lastVisitLabel: lastVisitAt ? formatCustomerLastVisitDate(lastVisitAt) : '—',
    lastVisitRelativeLabel: lastVisitAt ? formatDaysSinceLastVisitCompact(lastVisitAt, nowMs) : '',
    /** CRM notes on the customer row (not per-booking). */
    ownerNotes: typeof customerRow.notes === 'string' ? customerRow.notes : '',
    /** Reserved for future SMS / booking-link wiring. */
    bookingLink: '',
  };
}
