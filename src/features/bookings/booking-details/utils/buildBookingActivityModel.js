import {
  BOOKING_ACTIVITY_EVENT_DEFS,
  BOOKING_ACTIVITY_SMS_FAILED_STATUSES,
  BOOKING_ACTIVITY_SMS_SUCCESS_STATUSES,
  BOOKING_ACTIVITY_SMS_TYPE_TO_KEY,
} from '../constants/bookingActivityEvents';

/**
 * @param {string | null | undefined} status
 */
export function isSuccessfulActivitySmsStatus(status) {
  return BOOKING_ACTIVITY_SMS_SUCCESS_STATUSES.includes(String(status ?? '').trim().toLowerCase());
}

/**
 * @param {string | null | undefined} status
 */
export function isFailedActivitySmsStatus(status) {
  return BOOKING_ACTIVITY_SMS_FAILED_STATUSES.includes(String(status ?? '').trim().toLowerCase());
}

/**
 * @param {string | null | undefined} status
 */
export function isCanceledBookingStatus(status) {
  const key = String(status ?? '').trim().toLowerCase();
  return key === 'cancelled' || key === 'canceled';
}

/**
 * @param {string | null | undefined} iso
 */
export function formatActivityWhen(iso) {
  const value = String(iso ?? '').trim();
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const day = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return `${day} · ${time}`;
}

/**
 * @param {import('../constants/bookingActivityEvents').BookingActivityOutcome} outcome
 * @param {string} when
 * @param {{ optedOut?: boolean }} [extra]
 */
export function formatActivityStatusLine(outcome, when, extra = {}) {
  const whenPart = when ? ` · ${when}` : '';
  if (outcome === 'failed') {
    if (extra.optedOut) {
      return `Didn't send · they opted out${whenPart}`;
    }
    return `Didn't send${whenPart}`;
  }
  if (outcome === 'sending') {
    return `Sending${whenPart}`;
  }
  return `Sent${whenPart}`;
}

/**
 * @param {import('../constants/bookingActivityEvents').BookingActivityChannel} channel
 */
export function formatActivityChannelLabel(channel) {
  return channel === 'email' ? 'Email' : 'Text';
}

/**
 * @param {import('../constants/bookingActivityEvents').BookingActivityChannel} channel
 * @param {string} when
 * @param {{ optedOut?: boolean }} [extra]
 */
export function formatActivityMetaLine(channel, when, extra = {}) {
  const parts = [formatActivityChannelLabel(channel)];
  if (extra.optedOut) {
    parts.push('they opted out');
  }
  if (when) {
    parts.push(when);
  }
  return parts.join(' · ');
}

/**
 * @param {string | null | undefined} status
 * @returns {import('../constants/bookingActivityEvents').BookingActivityOutcome | null}
 */
function outcomeFromSmsStatus(status) {
  const key = String(status ?? '').trim().toLowerCase();
  if (key === 'queued') {
    return 'sending';
  }
  if (isSuccessfulActivitySmsStatus(key)) {
    return 'sent';
  }
  if (isFailedActivitySmsStatus(key)) {
    return 'failed';
  }
  return null;
}

/**
 * Latest SMS attempt per event — success or fail.
 *
 * @param {Array<{ type?: string; status?: string; sent_at?: string; created_at?: string }>} rows
 */
export function latestSmsByEventKey(rows) {
  /** @type {Map<string, { at: string; outcome: import('../constants/bookingActivityEvents').BookingActivityOutcome; optedOut: boolean }>} */
  const latest = new Map();
  for (const row of rows ?? []) {
    const outcome = outcomeFromSmsStatus(row?.status);
    if (!outcome) continue;
    const eventKey = BOOKING_ACTIVITY_SMS_TYPE_TO_KEY[String(row?.type ?? '').trim()];
    if (!eventKey) continue;
    const at =
      (typeof row.sent_at === 'string' && row.sent_at) ||
      (typeof row.created_at === 'string' && row.created_at) ||
      '';
    const prev = latest.get(eventKey);
    if (!prev || at > prev.at) {
      latest.set(eventKey, {
        at,
        outcome,
        optedOut: String(row?.status ?? '').trim().toLowerCase() === 'skipped_opt_out',
      });
    }
  }
  return latest;
}

/**
 * @param {object} input
 * @param {string | null | undefined} [input.bookingStatus]
 * @param {string | null | undefined} [input.customerEmail]
 * @param {string | null | undefined} [input.bookingCreatedAt]
 * @param {Array<object>} [input.smsRows]
 * @param {{ email_sent_at?: string | null; sms_sent_at?: string | null; created_at?: string | null } | null} [input.reviewInvite]
 * @returns {import('../constants/bookingActivityEvents').BookingActivityEvent[]}
 */
export function buildBookingActivityModel({
  bookingStatus = null,
  customerEmail = null,
  bookingCreatedAt = null,
  smsRows = [],
  reviewInvite = null,
} = {}) {
  const smsByKey = latestSmsByEventKey(smsRows);
  const hasCustomerEmail = Boolean(String(customerEmail ?? '').trim());
  const canceled = isCanceledBookingStatus(bookingStatus);
  const reviewEmailAt =
    typeof reviewInvite?.email_sent_at === 'string' ? reviewInvite.email_sent_at : '';
  const reviewSmsAt =
    typeof reviewInvite?.sms_sent_at === 'string' ? reviewInvite.sms_sent_at : '';

  /** @type {Array<{ key: string; outcome: import('../constants/bookingActivityEvents').BookingActivityOutcome; at?: string; optedOut?: boolean }>} */
  const selected = [];

  if (hasCustomerEmail) {
    selected.push({
      key: 'confirmation-email',
      outcome: 'sent',
      at: typeof bookingCreatedAt === 'string' ? bookingCreatedAt : '',
    });
  }
  if (smsByKey.has('confirmation-sms')) {
    selected.push({ key: 'confirmation-sms', ...smsByKey.get('confirmation-sms') });
  }
  if (smsByKey.has('reminder-sms')) {
    selected.push({ key: 'reminder-sms', ...smsByKey.get('reminder-sms') });
  }
  if (smsByKey.has('on-the-way')) {
    selected.push({ key: 'on-the-way', ...smsByKey.get('on-the-way') });
  }
  if (smsByKey.has('job-started')) {
    selected.push({ key: 'job-started', ...smsByKey.get('job-started') });
  }
  if (smsByKey.has('work-finished')) {
    selected.push({ key: 'work-finished', ...smsByKey.get('work-finished') });
  }
  if (canceled) {
    selected.push({ key: 'cancellation-email', outcome: 'sent' });
  }
  if (smsByKey.has('receipt-sms')) {
    selected.push({ key: 'receipt-sms', ...smsByKey.get('receipt-sms') });
  }
  if (reviewEmailAt) {
    selected.push({ key: 'review-email', outcome: 'sent', at: reviewEmailAt });
  }
  if (reviewSmsAt) {
    selected.push({ key: 'review-sms', outcome: 'sent', at: reviewSmsAt });
  }

  return selected
    .map((item) => {
      const def = BOOKING_ACTIVITY_EVENT_DEFS[item.key];
      if (!def) {
        return null;
      }
      const when = formatActivityWhen(item.at);
      return {
        key: item.key,
        icon: def.icon,
        title: def.title,
        channel: def.channel,
        outcome: item.outcome,
        at: item.at ?? '',
        whenLabel: when,
        optedOut: Boolean(item.optedOut),
        statusLine: formatActivityStatusLine(item.outcome, when, { optedOut: item.optedOut }),
      };
    })
    .filter(Boolean)
    .sort((a, b) => String(b.at ?? '').localeCompare(String(a.at ?? '')));
}
