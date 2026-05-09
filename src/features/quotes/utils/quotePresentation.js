import { QUOTE_DETAIL_KIND_REQUEST, QUOTE_DETAIL_KIND_SENT } from '../constants';
import { formatQuoteRowScheduleLabel, isValidCalendarYyyyMmDd } from './formatScheduledDateDisplay';
import { dbTimeToCreateQuoteTime12hSnapped } from './validateSendQuotePayload';

function startOfLocalDayMs(ms) {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Compact inbox timestamp — `Today · 9:14 AM`, `Yesterday`, or `May 6`.
 *
 * @param {string | null | undefined} iso
 * @param {number} [nowMs]
 */
export function formatQuoteInboxRelative(iso, nowMs = Date.now()) {
  if (!iso) return '';
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';

  const todayStart = startOfLocalDayMs(nowMs);
  const dayStart = startOfLocalDayMs(ms);
  const dayDiff = Math.round((todayStart - dayStart) / 86400000);

  const timeStr = new Date(ms).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (dayDiff === 0) return `Today · ${timeStr}`;
  if (dayDiff === 1) return 'Yesterday';
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * @param {string | null | undefined} iso
 */
export function formatQuoteDetailTimestamp(iso) {
  if (!iso) return '—';
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * @param {string | null | undefined} iso
 */
export function formatQuoteCalendarDate(iso) {
  if (!iso) return '—';
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * @param {number | string | null | undefined} cents
 */
export function formatQuoteMoney(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return '$0';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value % 100 === 0 ? 0 : 2,
  }).format(value / 100);
}

/**
 * Owner-facing label for list/detail (`sent` → `Pending` while awaiting customer).
 *
 * @param {string | null | undefined} status
 */
export function formatOwnerFacingQuoteStatus(status) {
  const s = String(status ?? '').toLowerCase();
  switch (s) {
    case 'requested':
      return 'Requested';
    case 'draft':
      return 'Draft';
    case 'sent':
      return 'Pending';
    case 'viewed':
      return 'Viewed';
    case 'approved':
      return 'Approved';
    case 'declined':
      return 'Declined';
    case 'expired':
      return 'Expired';
    case 'cancelled':
      return 'Cancelled';
    default:
      return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
  }
}

/**
 * @param {{ vehicle_year?: string | number | null; vehicle_make?: string | null; vehicle_model?: string | null }} row
 */
function formatVehicleLine(row) {
  const parts = [row?.vehicle_year, row?.vehicle_make, row?.vehicle_model]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean);
  return parts.join(' ');
}

/**
 * @param {{ request_message?: string | null; vehicle_year?: unknown; vehicle_make?: unknown; vehicle_model?: unknown }} row
 * @param {number} [maxChars]
 */
function summarizeInboundQuote(row, maxChars = 120) {
  const msg = String(row.request_message ?? '').trim();
  if (msg) {
    const line = msg.split('\n')[0].trim();
    const cap = Math.max(40, maxChars);
    return line.length > cap ? `${line.slice(0, cap - 1)}…` : line;
  }
  const vehicle = formatVehicleLine(row);
  if (vehicle) return vehicle;
  return 'Quote request';
}

/**
 * @typedef {object} QuoteRow
 * @property {string} id
 * @property {string} business_id
 * @property {string} status
 * @property {string} source
 * @property {string | null} [customer_name]
 * @property {string | null} [customer_email]
 * @property {string | null} [customer_phone]
 * @property {string | number | null} [vehicle_year]
 * @property {string | null} [vehicle_make]
 * @property {string | null} [vehicle_model]
 * @property {string | null} [request_message]
 * @property {string | null} [service_name]
 * @property {number | null} [price_cents]
 * @property {number | null} [duration_minutes]
 * @property {string | null} [scheduled_date]
 * @property {string | null} [scheduled_start_time]
 * @property {string | null} [updated_at]
 * @property {string | null} [created_at]
 */

/**
 * Inbox tabs: inbound vs outbound owner workflows (aligned with `quotes.source` / `quotes.status`).
 *
 * @param {QuoteRow[]} rows
 */
export function partitionQuotesForInbox(rows) {
  /** @type {QuoteRow[]} */
  const requests = [];
  /** @type {QuoteRow[]} */
  const sent = [];
  for (const row of rows) {
    const isInboundRequested =
      String(row.source) === 'customer_requested' && String(row.status) === 'requested';
    if (isInboundRequested) {
      requests.push(row);
    } else {
      sent.push(row);
    }
  }
  return { requests, sent };
}

/**
 * @param {QuoteRow} row
 * @param {number} nowMs
 */
export function mapQuoteRequestCard(row, nowMs) {
  const name = String(row.customer_name ?? '').trim() || 'Customer';
  return {
    id: row.id,
    customerName: name,
    summary: summarizeInboundQuote(row),
    receivedLabel: formatQuoteInboxRelative(row.updated_at ?? row.created_at, nowMs),
  };
}

/**
 * @param {QuoteRow} row
 */
export function mapSentQuoteCard(row) {
  const name = String(row.customer_name ?? '').trim() || 'Customer';
  const service = String(row.service_name ?? '').trim();
  const price = formatQuoteMoney(row.price_cents);
  const line =
    service && row.price_cents != null ? `${service} · ${price}` : service || price || '—';

  return {
    id: row.id,
    customerName: name,
    line,
    statusLabel: formatOwnerFacingQuoteStatus(row.status),
    statusRaw: String(row.status ?? ''),
  };
}

/**
 * Derives UI kind so stale navigation params still match DB state.
 *
 * @param {QuoteRow | null | undefined} row
 */
export function deriveQuoteDetailKind(row) {
  if (!row) return QUOTE_DETAIL_KIND_SENT;
  const isInboundRequested =
    String(row.source) === 'customer_requested' && String(row.status) === 'requested';
  return isInboundRequested ? QUOTE_DETAIL_KIND_REQUEST : QUOTE_DETAIL_KIND_SENT;
}

/**
 * @param {QuoteRow} row
 * @param {typeof QUOTE_DETAIL_KIND_REQUEST | typeof QUOTE_DETAIL_KIND_SENT} kind
 * @param {{ activeLinkExpiresAt?: string | null }} [opts]
 */
export function mapQuoteDetailModel(row, kind, opts = {}) {
  const activeLinkExpiresAt = opts.activeLinkExpiresAt ?? null;
  const name = String(row.customer_name ?? '').trim() || 'Customer';

  const base = {
    id: row.id,
    customerName: name,
    email: String(row.customer_email ?? '').trim(),
    phone: String(row.customer_phone ?? '').trim(),
  };

  if (kind === QUOTE_DETAIL_KIND_REQUEST) {
    const vehicle = formatVehicleLine(row);
    const serviceName = String(row.service_name ?? '').trim();
    const dateRaw = String(row.scheduled_date ?? '').trim();
    const scheduledDateYyyyMmDd = isValidCalendarYyyyMmDd(dateRaw) ? dateRaw : '';
    const scheduledStartTime12h = dbTimeToCreateQuoteTime12hSnapped(row.scheduled_start_time);
    return {
      ...base,
      summary: summarizeInboundQuote(row, 220),
      vehicle,
      message: String(row.request_message ?? '').trim(),
      receivedAt: formatQuoteDetailTimestamp(row.created_at ?? row.updated_at),
      serviceName,
      preferredTiming: formatQuoteRowScheduleLabel(row),
      vehicleYear: row.vehicle_year != null ? String(row.vehicle_year).trim() : '',
      vehicleMake: String(row.vehicle_make ?? '').trim(),
      vehicleModel: String(row.vehicle_model ?? '').trim(),
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
    };
  }

  const service = String(row.service_name ?? '').trim();
  const price = formatQuoteMoney(row.price_cents);
  const line =
    service && row.price_cents != null ? `${service} · ${price}` : service || price || '—';

  const st = String(row.status ?? '').toLowerCase();
  let linkHint = 'Customer opens your quote from the link you sent.';
  if (st === 'viewed') linkHint = 'Customer opened the quote link.';
  if (st === 'sent') linkHint = 'Waiting on customer response.';
  if (st === 'approved') linkHint = 'Customer approved this quote.';
  if (st === 'declined') linkHint = 'Customer declined this quote.';
  if (st === 'expired') linkHint = 'This quote link has expired.';
  if (st === 'draft') linkHint = 'Finish details and send a link when ready.';

  const quoteSummaryParts = [];
  if (service) quoteSummaryParts.push(service);
  if (row.price_cents != null) quoteSummaryParts.push(price);
  const quoteSummary = quoteSummaryParts.length ? quoteSummaryParts.join(' · ') : '—';

  const dm = Number(row.duration_minutes);
  let durationLabel = null;
  if (Number.isFinite(dm) && dm > 0) {
    if (dm >= 60) {
      const h = Math.floor(dm / 60);
      const m = dm % 60;
      durationLabel = m > 0 ? `${h} hr ${m} min` : `${h} hr`;
    } else {
      durationLabel = `${dm} min`;
    }
  }

  return {
    ...base,
    line,
    /** Short service title — detail hero (no duplicated combined line). */
    serviceTitle: service || '',
    /** Formatted USD or null when unset. */
    priceFormatted: row.price_cents != null ? price : null,
    durationLabel,
    statusLabel: formatOwnerFacingQuoteStatus(row.status),
    /** Raw DB enum for pill styling. */
    statusRaw: String(row.status ?? ''),
    sentAt: formatQuoteDetailTimestamp(row.updated_at ?? row.created_at),
    goodUntil: activeLinkExpiresAt ? formatQuoteCalendarDate(activeLinkExpiresAt) : '—',
    quoteSummary,
    linkHint,
  };
}
