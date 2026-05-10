import { notificationMinimalDisplayTitle } from './notificationMinimalTitle';
import { notificationSubtitle } from './notificationSubtitle';

/**
 * @param {string} isoString
 */
export function formatNotificationRelativeTime(isoString) {
  const t = new Date(isoString).getTime();
  if (Number.isNaN(t)) {
    return '';
  }
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 45) {
    return 'Now';
  }
  const min = Math.floor(diffSec / 60);
  if (min < 60) {
    return `${min}m`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return `${hr}h`;
  }
  const days = Math.floor(hr / 24);
  if (days === 1) {
    return '1d';
  }
  if (days < 7) {
    return `${days}d`;
  }
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * @param {string | undefined} type
 * @param {string | undefined} referenceType
 * @returns {'booking' | 'payment' | 'quote'}
 */
export function notificationInboxIconCategory(type, referenceType) {
  const blob = `${type ?? ''} ${referenceType ?? ''}`.toLowerCase();
  if (
    blob.includes('payment') ||
    blob.includes('payout') ||
    blob.includes('deposit') ||
    blob.includes('refund')
  ) {
    return 'payment';
  }
  if (blob.includes('quote')) {
    return 'quote';
  }
  return 'booking';
}

/**
 * @param {{
 *   id: string;
 *   type: string;
 *   reference_type: string;
 *   reference_id: string;
 *   title: string;
 *   body: string | null;
 *   read: boolean;
 *   created_at: string;
 *   metadata?: Record<string, unknown> | null;
 * }} row
 */
export function mapNotificationRowToInboxItem(row) {
  const displayTitle = notificationMinimalDisplayTitle(row.type, row.reference_type, row.title);
  const subtitle = notificationSubtitle(row.metadata, row.title, displayTitle, row.body);
  return {
    id: row.id,
    type: notificationInboxIconCategory(row.type, row.reference_type),
    displayTitle,
    subtitle,
    title: row.title?.trim() || 'Update',
    body: row.body ?? '',
    time: formatNotificationRelativeTime(row.created_at),
    /** ISO timestamp for day bucketing in Recent (local calendar). */
    createdAt: row.created_at,
    unread: !row.read,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    metadata: row.metadata ?? null,
  };
}
