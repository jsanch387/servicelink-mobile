import { formatPlanPriceCents } from '../constants/planCadence';

/**
 * @param {number} cents
 * @param {'month' | 'year' | 'week'} interval
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
 * @param {string | null | undefined} ymd
 */
export function formatDisplayDate(ymd) {
  const raw = String(ymd ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return '—';
  const [y, m, d] = raw.split('-').map((n) => Number(n));
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * @param {string | null | undefined} hhmm
 */
export function formatDisplayTime(hhmm) {
  const raw = String(hhmm ?? '').trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!match) return raw || '—';
  let hour = Number(match[1]);
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${suffix}`;
}

/**
 * @param {import('../mock/mockSubscriptions').SubscriptionStatus | string} status
 */
export function subscriptionStatusLabel(status) {
  switch (String(status ?? '').trim()) {
    case 'active':
      return 'Active';
    case 'past_due':
      return 'Past due';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
}

/**
 * List card model for subscribers hub.
 * @param {import('../mock/mockSubscriptions').MockSubscription} row
 */
export function mapSubscriptionListCard(row) {
  let nextVisitLabel = '';
  let footerLabel = 'Next visit';

  if (row.status === 'past_due') {
    nextVisitLabel = 'Payment failed';
    footerLabel = 'Billing';
  } else if (row.status === 'canceled') {
    nextVisitLabel = 'Canceled';
    footerLabel = 'Status';
  } else if (row.cancelAtPeriodEnd) {
    nextVisitLabel = formatDisplayDate(row.currentPeriodEnd);
    footerLabel = 'Ends';
  } else if (row.nextVisitDate) {
    nextVisitLabel = formatDisplayDate(row.nextVisitDate);
    footerLabel = 'Next visit';
  }

  return {
    id: row.id,
    customerName: row.customerName,
    planName: row.planName,
    statusLabel: subscriptionStatusLabel(row.status),
    statusRaw: row.status,
    nextVisitLabel,
    footerLabel,
  };
}

function mapNextBillDisplay(row) {
  if (row.status === 'canceled') return 'No upcoming bill';
  if (row.cancelAtPeriodEnd) {
    return `No more charges · ends ${formatDisplayDate(row.currentPeriodEnd)}`;
  }
  if (row.status === 'past_due') {
    const due = row.nextBillingDate || row.currentPeriodEnd;
    return `Payment failed · was due ${formatDisplayDate(due)}`;
  }
  const next = row.nextBillingDate || row.currentPeriodEnd;
  return formatDisplayDate(next);
}

function mapLastPaymentDisplay(row) {
  if (row.status === 'past_due' && row.lastPaymentFailedAt) {
    const failedDay = String(row.lastPaymentFailedAt).slice(0, 10);
    return `Failed · ${formatDisplayDate(failedDay)}`;
  }
  const paidAt = row.lastPaymentAt;
  const amount = Number(row.lastPaymentAmountCents);
  if (!paidAt) return 'None yet';
  if (Number.isFinite(amount) && amount > 0) {
    return `${formatPlanPriceCents(amount)} · ${formatDisplayDate(paidAt)}`;
  }
  return formatDisplayDate(paidAt);
}

/**
 * @param {import('../mock/mockSubscriptions').MockSubscription} row
 */
export function mapSubscriptionDetailModel(row) {
  const canCancel = row.status === 'active' || row.status === 'past_due';
  const showEndingSoon = Boolean(row.cancelAtPeriodEnd && row.status === 'active');

  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    customerEmail: row.customerEmail || '',
    customerPhone: row.customerPhone || '',
    planName: row.planName,
    serviceName: row.serviceName,
    priceFormatted: formatPlanPrice(row.priceCents, row.interval),
    statusRaw: row.status,
    statusLabel: subscriptionStatusLabel(row.status),
    preferredWeekday: row.preferredWeekday,
    preferredTime: row.preferredTime,
    nextVisitDateDisplay: row.nextVisitDate ? formatDisplayDate(row.nextVisitDate) : null,
    nextVisitTimeDisplay: row.nextVisitTime ? formatDisplayTime(row.nextVisitTime) : null,
    lastVisitDateDisplay: row.lastVisitDate ? formatDisplayDate(row.lastVisitDate) : null,
    startedAtDisplay: formatDisplayDate(row.startedAt),
    nextBillDisplay: mapNextBillDisplay(row),
    lastPaymentDisplay: mapLastPaymentDisplay(row),
    currentPeriodEndDisplay: formatDisplayDate(row.currentPeriodEnd),
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    showEndingSoon,
    endingSoonCopy: showEndingSoon
      ? `Cancels ${formatDisplayDate(row.currentPeriodEnd)}. No more visits after that.`
      : null,
    paymentFailed:
      row.status === 'past_due'
        ? {
            visible: true,
            title: 'Payment failed',
            body: 'Send them the billing portal link so they can update their card. Visits stay paused until this is fixed.',
          }
        : { visible: false },
    manageLink: row.manageLink,
    canCopyManageLink: Boolean(String(row.manageLink ?? '').trim()),
    canCancel,
    canCancelImmediateNote:
      row.status === 'past_due' ? 'Canceling stops retries and removes them from Active.' : null,
  };
}
