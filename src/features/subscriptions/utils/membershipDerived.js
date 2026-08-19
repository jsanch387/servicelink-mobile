/**
 * Derived membership fields — ported from web owner subscriber rules.
 */

/** @typedef {'week' | 'month' | 'year'} CadenceUnit */
/** @typedef {'active' | 'trialing' | 'past_due' | 'unpaid' | 'paused' | 'canceled' | 'incomplete'} OwnerSubscriberStatus */
/** @typedef {'needs_visit' | 'scheduled' | 'completed' | 'none'} VisitStatus */

/**
 * @param {string | null | undefined} iso
 * @returns {string | null} YYYY-MM-DD
 */
export function toYmd(iso) {
  const raw = String(iso ?? '').trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const t = Date.parse(raw);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * @param {string | null | undefined} iso
 */
export function isFutureTimestamp(iso) {
  const t = Date.parse(String(iso ?? ''));
  return Number.isFinite(t) && t > Date.now();
}

/**
 * Same instant for period-visit linkage (web: ≈ current_period_start).
 * @param {string | null | undefined} a
 * @param {string | null | undefined} b
 */
export function samePeriodStart(a, b) {
  const left = String(a ?? '').trim();
  const right = String(b ?? '').trim();
  if (!left || !right) return false;
  const ta = Date.parse(left);
  const tb = Date.parse(right);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return left === right;
  return Math.abs(ta - tb) < 1000;
}

/**
 * Cancel is scheduled (still has access) — treat as canceled for list/filters.
 * @param {{ status?: string; cancel_at_period_end?: boolean; cancelAtPeriodEnd?: boolean; cancel_at?: string | null; cancelAt?: string | null }} row
 */
export function isMembershipCancelScheduled(row) {
  const status = String(row?.status ?? '')
    .trim()
    .toLowerCase();
  if (status === 'canceled' || status === 'cancelled' || status === 'incomplete_expired') {
    return false;
  }
  if (row?.cancel_at_period_end === true || row?.cancelAtPeriodEnd === true) return true;
  const cancelAt = row?.cancel_at ?? row?.cancelAt ?? null;
  return isFutureTimestamp(cancelAt);
}

/**
 * @param {string | null | undefined} raw
 * @returns {OwnerSubscriberStatus}
 */
export function mapOwnerSubscriberStatus(raw) {
  const status = String(raw ?? '')
    .trim()
    .toLowerCase();
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
      return 'unpaid';
    case 'paused':
      return 'paused';
    case 'canceled':
    case 'cancelled':
    case 'incomplete_expired':
      return 'canceled';
    case 'incomplete':
      return 'incomplete';
    default:
      return 'incomplete';
  }
}

/**
 * @param {number} count
 * @param {string | null | undefined} unit
 */
export function formatMembershipCadenceLabel(count, unit) {
  const n = Math.max(1, Math.round(Number(count)) || 1);
  const u = String(unit ?? 'month')
    .trim()
    .toLowerCase();
  if (u === 'week' && n === 1) return 'Weekly';
  if (u === 'week' && n === 2) return 'Biweekly';
  if (u === 'month' && n === 1) return 'Monthly';
  if (u === 'year' && n === 1) return 'Yearly';
  const plural = n === 1 ? u : `${u}s`;
  return `Every ${n} ${plural}`;
}

/**
 * @param {{
 *   periodVisitBookingId?: string | null;
 *   periodVisitPeriodStart?: string | null;
 *   currentPeriodStart?: string | null;
 *   bookingStatus?: string | null;
 *   status: OwnerSubscriberStatus;
 *   cancelScheduled: boolean;
 *   planRemoved: boolean;
 * }} args
 * @returns {VisitStatus}
 */
export function resolveMembershipVisitStatus(args) {
  const linkedThisPeriod =
    Boolean(args.periodVisitBookingId) &&
    samePeriodStart(args.periodVisitPeriodStart, args.currentPeriodStart);

  if (linkedThisPeriod) {
    const bookingStatus = String(args.bookingStatus ?? '')
      .trim()
      .toLowerCase();
    if (bookingStatus === 'completed') return 'completed';
    if (bookingStatus === 'cancelled' || bookingStatus === 'canceled') {
      // fall through — treat as not on file
    } else if (bookingStatus) {
      return 'scheduled';
    }
  }

  const eligible =
    args.status === 'active' ||
    args.status === 'trialing' ||
    args.status === 'past_due' ||
    args.status === 'unpaid' ||
    args.status === 'paused';

  if (eligible && !args.cancelScheduled && !args.planRemoved) {
    return 'needs_visit';
  }
  return 'none';
}

/**
 * @param {{
 *   status: OwnerSubscriberStatus;
 *   cancelScheduled: boolean;
 *   planRemoved: boolean;
 * }} args
 */
export function isActiveListMember(args) {
  const okStatus =
    args.status === 'active' ||
    args.status === 'trialing' ||
    args.status === 'past_due' ||
    args.status === 'unpaid' ||
    args.status === 'paused';
  return okStatus && !args.planRemoved && !args.cancelScheduled;
}

/**
 * Pill label + tone key for theme.
 * @param {{
 *   status: OwnerSubscriberStatus;
 *   cancelScheduled: boolean;
 *   visitStatus: VisitStatus;
 * }} args
 * @returns {{ label: string; tone: string }}
 */
export function resolveSubscriberPill(args) {
  const { status, cancelScheduled, visitStatus } = args;

  if (status === 'past_due') {
    return { label: 'Past due', tone: 'past_due' };
  }
  if (status === 'unpaid') {
    return { label: 'Unpaid', tone: 'past_due' };
  }
  if (cancelScheduled || status === 'canceled') {
    return {
      label: 'Canceled',
      tone: cancelScheduled && status !== 'canceled' ? 'cancel_scheduled' : 'canceled',
    };
  }
  if (visitStatus === 'needs_visit') {
    return { label: 'Needs visit', tone: 'needs_visit' };
  }
  if (status === 'trialing') {
    return { label: 'Trial', tone: 'trialing' };
  }
  if (status === 'paused') {
    return { label: 'Paused', tone: 'paused' };
  }
  if (status === 'incomplete') {
    return { label: 'Incomplete', tone: 'incomplete' };
  }
  return { label: 'Active', tone: 'active' };
}

/**
 * @param {string | null | undefined} brand
 * @param {string | null | undefined} last4
 */
export function formatPaymentMethodLabel(brand, last4) {
  const b = String(brand ?? '').trim();
  const l = String(last4 ?? '').trim();
  if (!b || !l) return null;
  const nice = b.charAt(0).toUpperCase() + b.slice(1).toLowerCase();
  return `${nice} ••${l}`;
}

/**
 * @param {string | null | undefined} lastInvoiceStatus
 * @param {string | null | undefined} paidAtYmd
 */
export function formatLastPaymentLabel(lastInvoiceStatus, paidAtYmd) {
  const status = String(lastInvoiceStatus ?? '')
    .trim()
    .toLowerCase();
  if (status === 'paid' && paidAtYmd) {
    return `Paid ${paidAtYmd}`;
  }
  if (status === 'paid') return 'Paid';
  if (status === 'open' || status === 'draft') return null;
  if (status) return status.charAt(0).toUpperCase() + status.slice(1);
  return null;
}
