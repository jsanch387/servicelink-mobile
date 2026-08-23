import { formatNotificationRelativeTime } from '../../../notifications/utils/notificationInboxPresentation';
import {
  BOOKING_ACTIVITY_EVENT_DEFS,
  BOOKING_ACTIVITY_GROUP_ORDER,
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
export function isCanceledBookingStatus(status) {
  const key = String(status ?? '').trim().toLowerCase();
  return key === 'cancelled' || key === 'canceled';
}

/**
 * @param {string | null | undefined} iso
 */
function statusFromTimestamp(iso) {
  const label = iso ? formatNotificationRelativeTime(iso) : '';
  return label || 'Sent';
}

/**
 * @param {Array<{ type?: string; status?: string; sent_at?: string; created_at?: string }>} rows
 */
export function latestSuccessfulSmsByEventKey(rows) {
  /** @type {Map<string, { at: string }>} */
  const latest = new Map();
  for (const row of rows ?? []) {
    if (!isSuccessfulActivitySmsStatus(row?.status)) continue;
    const eventKey = BOOKING_ACTIVITY_SMS_TYPE_TO_KEY[String(row?.type ?? '').trim()];
    if (!eventKey) continue;
    const at =
      (typeof row.sent_at === 'string' && row.sent_at) ||
      (typeof row.created_at === 'string' && row.created_at) ||
      '';
    const prev = latest.get(eventKey);
    if (!prev || at > prev.at) {
      latest.set(eventKey, { at });
    }
  }
  return latest;
}

/**
 * @param {object} input
 * @param {string | null | undefined} [input.bookingStatus]
 * @param {string | null | undefined} [input.customerEmail]
 * @param {Array<object>} [input.smsRows]
 * @param {{ email_sent_at?: string | null; sms_sent_at?: string | null; created_at?: string | null } | null} [input.reviewInvite]
 * @returns {import('../constants/bookingActivityEvents').BookingActivityGroup[]}
 */
export function buildBookingActivityModel({
  bookingStatus = null,
  customerEmail = null,
  smsRows = [],
  reviewInvite = null,
} = {}) {
  const smsByKey = latestSuccessfulSmsByEventKey(smsRows);
  const hasCustomerEmail = Boolean(String(customerEmail ?? '').trim());
  const canceled = isCanceledBookingStatus(bookingStatus);
  const reviewAt =
    (typeof reviewInvite?.email_sent_at === 'string' && reviewInvite.email_sent_at) ||
    (typeof reviewInvite?.sms_sent_at === 'string' && reviewInvite.sms_sent_at) ||
    (typeof reviewInvite?.created_at === 'string' && reviewInvite.created_at) ||
    '';
  const hasReviewInvite = Boolean(reviewInvite && (reviewInvite.email_sent_at || reviewInvite.sms_sent_at));

  /** @type {Array<{ key: string; status: string; comingSoon?: boolean }>} */
  const selected = [];

  if (hasCustomerEmail) {
    selected.push({ key: 'confirmation-email', status: 'Sent' });
  }
  if (smsByKey.has('confirmation-sms')) {
    selected.push({
      key: 'confirmation-sms',
      status: statusFromTimestamp(smsByKey.get('confirmation-sms')?.at),
    });
  }
  if (smsByKey.has('reminder-sms')) {
    selected.push({
      key: 'reminder-sms',
      status: statusFromTimestamp(smsByKey.get('reminder-sms')?.at),
    });
  }
  if (smsByKey.has('on-the-way')) {
    selected.push({
      key: 'on-the-way',
      status: statusFromTimestamp(smsByKey.get('on-the-way')?.at),
    });
  }
  if (smsByKey.has('job-started')) {
    selected.push({
      key: 'job-started',
      status: statusFromTimestamp(smsByKey.get('job-started')?.at),
    });
  }
  if (smsByKey.has('work-finished')) {
    selected.push({
      key: 'work-finished',
      status: statusFromTimestamp(smsByKey.get('work-finished')?.at),
    });
  }
  if (canceled) {
    selected.push({ key: 'cancellation-email', status: 'Sent' });
  }
  if (smsByKey.has('receipt-sms')) {
    selected.push({
      key: 'receipt-sms',
      status: statusFromTimestamp(smsByKey.get('receipt-sms')?.at),
    });
  }
  if (hasReviewInvite) {
    selected.push({ key: 'review-link', status: statusFromTimestamp(reviewAt) });
  }

  /** @type {Map<string, import('../constants/bookingActivityEvents').BookingActivityEvent[]>} */
  const byGroup = new Map();
  for (const item of selected) {
    const def = BOOKING_ACTIVITY_EVENT_DEFS[item.key];
    if (!def) continue;
    const list = byGroup.get(def.group) ?? [];
    list.push({
      key: item.key,
      icon: def.icon,
      iconColor: def.iconColor,
      iconBg: def.iconBg,
      title: def.title,
      status: item.status,
      comingSoon: Boolean(item.comingSoon),
    });
    byGroup.set(def.group, list);
  }

  return BOOKING_ACTIVITY_GROUP_ORDER.filter((group) => (byGroup.get(group.id) ?? []).length > 0).map(
    (group) => ({
      id: group.id,
      title: group.title,
      events: byGroup.get(group.id) ?? [],
    }),
  );
}
