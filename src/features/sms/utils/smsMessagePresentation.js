import { formatNotificationRelativeTime } from '../../notifications/utils/notificationInboxPresentation';
import { formatPhoneForDisplay } from '../../../utils/phone';
import {
  SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION,
  SMS_MESSAGE_TYPE_INVOICE,
  SMS_MESSAGE_TYPE_JOB_COMPLETED,
  SMS_MESSAGE_TYPE_JOB_STARTED,
  SMS_MESSAGE_TYPE_LABELS,
  SMS_MESSAGE_TYPE_ON_THE_WAY,
  SMS_MESSAGE_TYPE_REMINDER,
  SMS_MESSAGE_TYPE_WORK_FINISHED,
} from '../constants/smsMessageTypes';

/**
 * @param {string | null | undefined} type
 * @returns {string}
 */
export function smsMessageTypeLabel(type) {
  const key = typeof type === 'string' ? type.trim() : '';
  if (!key) {
    return 'Text message';
  }
  if (SMS_MESSAGE_TYPE_LABELS[key]) {
    return SMS_MESSAGE_TYPE_LABELS[key];
  }
  return key
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Compact Ionicons glyph for a message type.
 * @param {string | null | undefined} type
 * @returns {import('@expo/vector-icons/Ionicons').IconProps['name']}
 */
export function smsMessageTypeIcon(type) {
  const key = typeof type === 'string' ? type.trim() : '';
  if (key === SMS_MESSAGE_TYPE_ON_THE_WAY) return 'navigate-outline';
  if (key === SMS_MESSAGE_TYPE_BOOKING_CONFIRMATION) return 'checkmark-circle-outline';
  if (key === SMS_MESSAGE_TYPE_JOB_STARTED) return 'play-outline';
  if (key === SMS_MESSAGE_TYPE_WORK_FINISHED) return 'flag-outline';
  if (key === SMS_MESSAGE_TYPE_JOB_COMPLETED) return 'ribbon-outline';
  if (key === SMS_MESSAGE_TYPE_REMINDER) return 'alarm-outline';
  if (key === SMS_MESSAGE_TYPE_INVOICE) return 'receipt-outline';
  return 'chatbubble-ellipses-outline';
}

/**
 * @param {string | null | undefined} status
 * @returns {{ label: string; tone: 'success' | 'muted' | 'danger' | 'info' }}
 */
export function smsMessageStatusPresentation(status) {
  const key = typeof status === 'string' ? status.trim().toLowerCase() : '';
  if (key === 'delivered' || key === 'sent') {
    return { label: key === 'delivered' ? 'Delivered' : 'Sent', tone: 'success' };
  }
  if (key === 'queued') {
    return { label: 'Queued', tone: 'info' };
  }
  if (key === 'failed' || key === 'undelivered') {
    return { label: key === 'undelivered' ? 'Undelivered' : 'Failed', tone: 'danger' };
  }
  if (key === 'skipped_opt_out') {
    return { label: 'Skipped', tone: 'muted' };
  }
  if (!key) {
    return { label: 'Unknown', tone: 'muted' };
  }
  return {
    label: key.charAt(0).toUpperCase() + key.slice(1),
    tone: 'muted',
  };
}

/**
 * Hides the compliance footer on the Texts sent timeline only.
 * The real SMS still includes it — this is display cleanup.
 *
 * @param {string | null | undefined} body
 * @returns {string}
 */
export function stripSmsOptOutFooterForDisplay(body) {
  const raw = typeof body === 'string' ? body.trim() : '';
  if (!raw) {
    return '';
  }

  // Trailing "Reply STOP to …" / "Text STOP to …" lines (and close variants).
  return raw
    .replace(
      /(?:\r?\n)+\s*(?:reply|text)\s+stop\s+to\s+(?:opt[\s-]?out|unsubscribe|cancel)[.\s]*$/i,
      '',
    )
    .replace(/\s*(?:reply|text)\s+stop\s+to\s+(?:opt[\s-]?out|unsubscribe|cancel)[.\s]*$/i, '')
    .trim();
}

/**
 * @param {object | null | undefined} row
 * @returns {{
 *   id: string;
 *   type: string;
 *   title: string;
 *   iconName: import('@expo/vector-icons/Ionicons').IconProps['name'];
 *   body: string;
 *   status: string;
 *   statusLabel: string;
 *   statusTone: 'success' | 'muted' | 'danger' | 'info';
 *   phoneDisplay: string;
 *   timeLabel: string;
 *   createdAt: string;
 * }}
 */
export function mapSmsMessageRowToTimelineItem(row) {
  const createdAt =
    (typeof row?.sent_at === 'string' && row.sent_at) ||
    (typeof row?.created_at === 'string' && row.created_at) ||
    '';
  const status = typeof row?.status === 'string' ? row.status : '';
  const statusPresentation = smsMessageStatusPresentation(status);
  const phoneDisplay = formatPhoneForDisplay(row?.to_phone) || 'Phone unavailable';
  const body = stripSmsOptOutFooterForDisplay(row?.body);
  const type = typeof row?.type === 'string' ? row.type : '';

  return {
    id: String(row?.id ?? ''),
    type,
    title: smsMessageTypeLabel(type),
    iconName: smsMessageTypeIcon(type),
    body,
    status,
    statusLabel: statusPresentation.label,
    statusTone: statusPresentation.tone,
    phoneDisplay,
    timeLabel: createdAt ? formatNotificationRelativeTime(createdAt) : '',
    createdAt,
  };
}

/**
 * Sample timeline rows for empty-state design review.
 * @returns {ReturnType<typeof mapSmsMessageRowToTimelineItem>[]}
 */
export function buildSentTextsDesignPreviewItems() {
  const now = Date.now();
  const rows = [
    {
      id: 'preview-1',
      type: 'on_the_way',
      body: 'Sparkle Auto is on the way for your appointment.',
      status: 'delivered',
      to_phone: '+15551234567',
      sent_at: new Date(now - 12 * 60 * 1000).toISOString(),
      created_at: new Date(now - 12 * 60 * 1000).toISOString(),
      error: null,
    },
    {
      id: 'preview-2',
      type: 'booking_confirmation',
      body: 'Your appointment with Sparkle Auto is confirmed for tomorrow at 10:00 AM.',
      status: 'sent',
      to_phone: '+15559876543',
      sent_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      error: null,
    },
    {
      id: 'preview-3',
      type: 'job_completed',
      body: 'Thanks for choosing Sparkle Auto. View your receipt and leave a review.',
      status: 'delivered',
      to_phone: '+15555550123',
      sent_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
      error: null,
    },
    {
      id: 'preview-4',
      type: 'reminder',
      body: 'Reminder: your detail is tomorrow at 2:00 PM.',
      status: 'failed',
      to_phone: '+15550001111',
      sent_at: new Date(now - 50 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(now - 50 * 60 * 60 * 1000).toISOString(),
      error: null,
    },
  ];
  return rows.map(mapSmsMessageRowToTimelineItem);
}
