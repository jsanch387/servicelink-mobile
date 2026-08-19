import { formatPlanPriceCents } from '../constants/planCadence';
import { formatDisplayDate as formatYmdDisplay } from './subscriptionDates';
import { formatMembershipCadenceLabel, mapOwnerSubscriberStatus } from './membershipDerived';

export { formatDisplayDate, formatDisplayTime } from './subscriptionDates';

/**
 * @param {number} cents
 * @param {'month' | 'year' | 'week' | string} interval
 */
export function formatPlanPrice(cents, interval) {
  const amount = Number(cents);
  if (!Number.isFinite(amount)) return '—';
  const dollars = (amount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
  });
  if (interval === 'year') return `${dollars}/yr`;
  if (interval === 'week') return `${dollars}/wk`;
  return `${dollars}/mo`;
}

/**
 * @param {string | null | undefined} status
 * @param {string | null | undefined} [pillLabel]
 */
export function subscriptionStatusLabel(status, pillLabel) {
  if (pillLabel) return String(pillLabel);
  switch (String(status ?? '').trim()) {
    case 'active':
      return 'Active';
    case 'trialing':
      return 'Trial';
    case 'past_due':
      return 'Past due';
    case 'unpaid':
      return 'Unpaid';
    case 'paused':
      return 'Paused';
    case 'canceled':
      return 'Canceled';
    case 'incomplete':
      return 'Incomplete';
    default:
      return 'Unknown';
  }
}

/**
 * List card model for subscribers hub / plan subscribers.
 * @param {object} row — mapped MobileSubscriber
 */
export function mapSubscriptionListCard(row) {
  const status = String(row.status ?? row.statusRaw ?? '').trim();
  const cancelScheduled = Boolean(row.cancelScheduled ?? row.cancelAtPeriodEnd);
  const visitStatus = String(row.visitStatus ?? '').trim();
  const pillLabel = row.pillLabel || subscriptionStatusLabel(status);
  const pillTone = row.pillTone || status;
  const isCanceledUi = cancelScheduled || status === 'canceled';

  let metaLabel = '';
  let metaValue = '';

  if (!isCanceledUi) {
    if (status === 'past_due' || status === 'unpaid') {
      metaLabel = 'Billing';
      metaValue = 'Payment failed';
    } else if (visitStatus === 'needs_visit') {
      metaLabel = 'Visit';
      metaValue = 'Needs a visit';
    } else if (visitStatus === 'scheduled' && row.periodVisitDate) {
      metaLabel = 'Next visit';
      metaValue = formatYmdDisplay(row.periodVisitDate);
    } else if (visitStatus === 'completed' && row.periodVisitDate) {
      metaLabel = 'Last visit';
      metaValue = formatYmdDisplay(row.periodVisitDate);
    } else if (row.nextBillingAt) {
      metaLabel = 'Next bill';
      metaValue = formatYmdDisplay(row.nextBillingAt);
    }
  }

  const scheduleAmount = [
    row.cadenceLabel ||
      formatMembershipCadenceLabel(row.intervalCount, row.intervalUnit || row.interval),
    formatPlanPriceCents(row.amountCents ?? row.priceCents),
  ]
    .filter(Boolean)
    .join(' · ');

  const cadenceOnly =
    row.cadenceLabel ||
    formatMembershipCadenceLabel(row.intervalCount, row.intervalUnit || row.interval);

  return {
    id: row.id,
    customerName: row.customerName,
    email: row.customerEmail || row.email || '',
    planName: row.planName,
    cadenceLabel: cadenceOnly,
    scheduleAmount,
    statusLabel: pillLabel,
    statusRaw: pillTone,
    metaLabel,
    metaValue,
    nextVisitLabel: metaValue,
    footerLabel: metaLabel,
    cadenceAmount: scheduleAmount,
  };
}

function mapNextBillShort(row) {
  if (row.status === 'canceled' || row.cancelScheduled || row.cancelAtPeriodEnd) return '—';
  if (row.nextBillingAt) return formatYmdDisplay(row.nextBillingAt);
  if (row.nextBillingDate) return formatYmdDisplay(row.nextBillingDate);
  if (row.currentPeriodEnd) return formatYmdDisplay(row.currentPeriodEnd);
  return '—';
}

function mapLastPaymentShort(row) {
  if (row.lastPaymentLabel) {
    // Prefer short date when label is "Paid YYYY-MM-DD"
    const paid = /^Paid (\d{4}-\d{2}-\d{2})$/.exec(String(row.lastPaymentLabel));
    if (paid) return formatYmdDisplay(paid[1]);
    return row.lastPaymentLabel;
  }
  if (row.status === 'past_due' || row.status === 'unpaid') {
    if (row.lastPaymentFailedAt) return formatYmdDisplay(row.lastPaymentFailedAt);
  }
  if (row.lastPaymentAt) return formatYmdDisplay(row.lastPaymentAt);
  return '—';
}

/**
 * Detail body model from mapped MobileSubscriber.
 * @param {object} row
 */
export function mapSubscriptionDetailModel(row) {
  const status = String(row.status ?? '').trim();
  const cancelScheduled = Boolean(row.cancelScheduled ?? row.cancelAtPeriodEnd);
  const visitStatus = String(row.visitStatus ?? '').trim();
  const scheduleLabel =
    row.cadenceLabel ||
    formatMembershipCadenceLabel(row.intervalCount, row.intervalUnit || row.interval);
  const amountShort = formatPlanPriceCents(row.amountCents ?? row.priceCents);
  const pillLabel = row.pillLabel || subscriptionStatusLabel(status);
  const pillTone = row.pillTone || status;

  const canCancel =
    mapOwnerSubscriberStatus(status) !== 'canceled' &&
    !cancelScheduled &&
    !Boolean(row.planRemoved);

  const showEndingSoon = cancelScheduled && status !== 'canceled';
  const accessDate = row.accessUntilYmd || row.currentPeriodEnd;

  const hasScheduledVisit = visitStatus === 'scheduled';
  const hasCompletedVisit = visitStatus === 'completed';
  const needsVisit = visitStatus === 'needs_visit';

  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    customerEmail: row.customerEmail || row.email || '',
    customerPhone: row.customerPhone || row.phone || '',
    planId: row.planId,
    planName: row.planName,
    planRemoved: Boolean(row.planRemoved),
    serviceName: row.serviceName || row.planName,
    scheduleLabel,
    planSubtitle: `${row.planName} · ${scheduleLabel}`,
    priceFormatted: formatPlanPrice(
      row.amountCents ?? row.priceCents,
      row.intervalUnit || row.interval,
    ),
    amountShort,
    statusRaw: pillTone,
    statusLabel: pillLabel,
    visitStatus,
    needsVisit,
    nextVisitDateDisplay:
      hasScheduledVisit || hasCompletedVisit
        ? row.periodVisitDate
          ? formatYmdDisplay(row.periodVisitDate)
          : null
        : null,
    nextVisitTimeDisplay:
      hasScheduledVisit || hasCompletedVisit
        ? row.periodVisitTime
          ? formatDisplayTimeSafe(row.periodVisitTime)
          : null
        : null,
    lastVisitDateDisplay:
      hasCompletedVisit && row.periodVisitDate ? formatYmdDisplay(row.periodVisitDate) : null,
    hasNextVisit: hasScheduledVisit,
    periodVisitBookingId: row.periodVisitBookingId ?? null,
    initialBookingId: row.initialBookingId ?? null,
    visitDurationMinutes: Math.max(0, Math.round(Number(row.visitDurationMinutes)) || 0),
    startedAtDisplay: formatYmdDisplay(row.startedAt),
    nextBillShort: mapNextBillShort(row),
    lastPaymentShort: mapLastPaymentShort(row),
    paymentMethodLabel: row.paymentMethodLabel || null,
    notes: row.notes || null,
    currentPeriodEndDisplay: formatYmdDisplay(row.currentPeriodEnd || row.accessUntilYmd),
    cancelAtPeriodEnd: cancelScheduled,
    showEndingSoon,
    endingSoonCopy: showEndingSoon ? `Access until ${formatYmdDisplay(accessDate)}` : null,
    planRemovedCopy: row.planRemoved
      ? 'This was an older subscription that’s no longer offered. History is kept for your records.'
      : null,
    paymentFailed:
      status === 'past_due' || status === 'unpaid'
        ? {
            visible: true,
            title: 'Payment failed',
            body: 'Their card didn’t go through. Visits stay paused until they update payment.',
          }
        : { visible: false },
    manageLink: row.manageLink || '',
    canCopyManageLink: false,
    canSendRebookLink:
      needsVisit && Boolean(row.customerEmail || row.email || row.customerPhone || row.phone),
    canCancel,
    canCancelImmediateNote:
      status === 'past_due' || status === 'unpaid'
        ? 'Canceling stops retries and removes them from Active.'
        : null,
  };
}

function formatDisplayTimeSafe(hhmm) {
  const raw = String(hhmm ?? '').trim();
  const match = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (!match) return raw || null;
  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}
