import { cadenceKeyFromParts } from '../constants/planCadence';
import {
  formatLastPaymentLabel,
  formatMembershipCadenceLabel,
  formatPaymentMethodLabel,
  isActiveListMember,
  isMembershipCancelScheduled,
  mapOwnerSubscriberStatus,
  resolveMembershipVisitStatus,
  resolveSubscriberPill,
  toYmd,
} from './membershipDerived';

/**
 * @typedef {import('./membershipDerived').CadenceUnit} CadenceUnit
 * @typedef {import('./membershipDerived').OwnerSubscriberStatus} OwnerSubscriberStatus
 * @typedef {import('./membershipDerived').VisitStatus} VisitStatus
 */

/**
 * @param {Record<string, unknown>} priceRow
 */
export function mapPlanPriceRow(priceRow) {
  const intervalUnit = String(priceRow.interval_unit ?? 'month')
    .trim()
    .toLowerCase();
  const interval = intervalUnit === 'week' || intervalUnit === 'year' ? intervalUnit : 'month';
  const count = Math.max(1, Math.round(Number(priceRow.interval_count)) || 1);
  const cadenceInterval = interval === 'year' ? 'month' : interval;
  const cadenceCount = interval === 'year' ? Math.min(12, count * 12) : count;
  return {
    id: String(priceRow.id ?? ''),
    intervalUnit: /** @type {CadenceUnit} */ (interval),
    intervalCount: count,
    priceCents: Math.max(0, Math.round(Number(priceRow.price_cents)) || 0),
    isDefault: Boolean(priceRow.is_default),
    currency: String(priceRow.currency ?? 'usd'),
    /** UI schedule shape used by plan cards / detail */
    cadenceKey: cadenceKeyFromParts(cadenceCount, cadenceInterval),
    count,
    interval,
    label: formatMembershipCadenceLabel(count, interval),
  };
}

/**
 * @param {Record<string, unknown>} planRow
 * @param {ReturnType<typeof mapPlanPriceRow>[]} prices
 * @param {number} activeSubscriberCount
 */
export function mapMembershipPlan(planRow, prices, activeSubscriberCount) {
  const sortedPrices = [...prices].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return a.priceCents - b.priceCents;
  });
  const defaultPrice = sortedPrices.find((p) => p.isDefault) ?? sortedPrices[0] ?? null;

  return {
    id: String(planRow.id ?? ''),
    name: String(planRow.name ?? 'Subscription').trim() || 'Subscription',
    description: String(planRow.description ?? '').trim(),
    visitDurationMinutes: Math.max(0, Math.round(Number(planRow.visit_duration_minutes)) || 0),
    isPublished: Boolean(planRow.is_published),
    sortOrder: Number(planRow.sort_order) || 0,
    createdAt: String(planRow.created_at ?? ''),
    deletedAt: planRow.deleted_at != null ? String(planRow.deleted_at) : null,
    /** Card / detail UI */
    offeredSchedules: sortedPrices,
    cadenceOptions: sortedPrices,
    priceCents: defaultPrice?.priceCents ?? 0,
    interval: defaultPrice?.interval ?? 'month',
    subscriberCount: Math.max(0, Math.round(Number(activeSubscriberCount)) || 0),
    activeSubscriberCount: Math.max(0, Math.round(Number(activeSubscriberCount)) || 0),
  };
}

/**
 * @param {object} args
 * @param {Record<string, unknown>} args.row
 * @param {Record<string, unknown> | null} [args.plan]
 * @param {Record<string, unknown> | null} [args.booking]
 */
export function mapMembershipSubscriber({ row, plan = null, booking = null }) {
  const status = mapOwnerSubscriberStatus(row.status);
  const cancelScheduled = isMembershipCancelScheduled(row);
  const planDeleted = plan?.deleted_at != null;
  const planRemoved = !row.plan_id || !plan || planDeleted;
  // Keep history on Canceled even after soft-delete; don't suffix "(removed)" on list labels.
  const planName = String(plan?.name ?? '').trim() || 'Subscription';

  const intervalUnit = String(row.interval_unit ?? 'month')
    .trim()
    .toLowerCase();
  const unit = intervalUnit === 'week' || intervalUnit === 'year' ? intervalUnit : 'month';
  const intervalCount = Math.max(1, Math.round(Number(row.interval_count)) || 1);
  const amountCents = Math.max(0, Math.round(Number(row.amount_cents)) || 0);

  const currentPeriodStart =
    row.current_period_start != null ? String(row.current_period_start) : null;
  const currentPeriodEnd = row.current_period_end != null ? String(row.current_period_end) : null;
  const cancelAt = row.cancel_at != null ? String(row.cancel_at) : null;
  const periodVisitBookingId =
    row.period_visit_booking_id != null ? String(row.period_visit_booking_id) : null;
  const periodVisitPeriodStart =
    row.period_visit_period_start != null ? String(row.period_visit_period_start) : null;

  const bookingStatus = booking?.status != null ? String(booking.status) : null;
  const visitStatus = resolveMembershipVisitStatus({
    periodVisitBookingId,
    periodVisitPeriodStart,
    currentPeriodStart,
    bookingStatus,
    status,
    cancelScheduled,
    planRemoved,
  });

  const pill = resolveSubscriberPill({ status, cancelScheduled, visitStatus });
  const activeList = isActiveListMember({ status, cancelScheduled, planRemoved });

  const accessUntilYmd = toYmd(cancelAt) || toYmd(currentPeriodEnd);
  const canceledAtYmd = toYmd(row.canceled_at);
  const endedAtYmd = toYmd(row.ended_at);
  const nextBillingAt =
    status === 'canceled' || cancelScheduled ? null : toYmd(cancelAt) || toYmd(currentPeriodEnd);

  const emailLocal =
    String(row.customer_email ?? '')
      .trim()
      .split('@')[0] || '';
  const customerName = String(row.customer_name ?? '').trim() || emailLocal || 'Customer';

  const periodVisitDate = booking?.scheduled_date != null ? toYmd(booking.scheduled_date) : null;
  let periodVisitTime = null;
  if (booking?.start_time != null) {
    const raw = String(booking.start_time).trim();
    periodVisitTime = raw.length >= 5 ? raw.slice(0, 5) : raw || null;
  }

  const lastPaymentLabel = formatLastPaymentLabel(
    row.last_invoice_status != null ? String(row.last_invoice_status) : null,
    toYmd(row.current_period_start),
  );

  return {
    id: String(row.id ?? ''),
    customerId: row.customer_id != null ? String(row.customer_id) : null,
    customerName,
    customerEmail: String(row.customer_email ?? '').trim(),
    customerPhone: String(row.customer_phone ?? '').trim(),
    email: String(row.customer_email ?? '').trim(),
    phone: String(row.customer_phone ?? '').trim() || undefined,
    planId: row.plan_id != null ? String(row.plan_id) : '',
    planName,
    planRemoved,
    visitDurationMinutes: plan?.visit_duration_minutes
      ? Math.round(Number(plan.visit_duration_minutes)) || undefined
      : undefined,
    cadenceLabel: formatMembershipCadenceLabel(intervalCount, unit),
    intervalUnit: /** @type {CadenceUnit} */ (unit),
    intervalCount,
    /** legacy presentation aliases */
    interval: unit === 'year' ? 'month' : unit,
    priceCents: amountCents,
    amountCents,
    status,
    statusRaw: status,
    startedAt: toYmd(row.created_at) || '',
    nextBillingAt,
    currentPeriodEnd: toYmd(currentPeriodEnd),
    nextBillingDate: nextBillingAt,
    cancelAtPeriodEnd: cancelScheduled,
    cancelScheduled,
    lastPaymentLabel: lastPaymentLabel || undefined,
    lastPaymentAt: null,
    lastPaymentFailedAt:
      status === 'past_due' || status === 'unpaid' ? toYmd(currentPeriodStart) : null,
    lastPaymentAmountCents: amountCents,
    paymentMethodLabel: formatPaymentMethodLabel(
      row.payment_method_brand != null ? String(row.payment_method_brand) : null,
      row.payment_method_last4 != null ? String(row.payment_method_last4) : null,
    ),
    notes: row.notes != null ? String(row.notes) : null,
    visitStatus,
    initialBookingId: row.initial_booking_id != null ? String(row.initial_booking_id) : null,
    periodVisitBookingId,
    periodVisitDate,
    periodVisitTime,
    nextVisitDate:
      visitStatus === 'scheduled' || visitStatus === 'completed' ? periodVisitDate : null,
    nextVisitTime:
      visitStatus === 'scheduled' || visitStatus === 'completed' ? periodVisitTime : null,
    lastVisitDate: visitStatus === 'completed' ? periodVisitDate : null,
    pillLabel: pill.label,
    pillTone: pill.tone,
    isActiveList: activeList,
    isCanceledList: !activeList,
    accessUntilYmd,
    canceledAt: canceledAtYmd,
    endedAt: endedAtYmd,
    manageLink: '',
    preferredWeekday: '',
    preferredTime: '',
    serviceName: planName,
  };
}
