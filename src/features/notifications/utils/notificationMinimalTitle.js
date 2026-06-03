/** Headlines produced by `notificationMinimalDisplayTitle` (for subtitle / legacy title parsing). */
export const KNOWN_MINIMAL_INBOX_HEADLINES = new Set([
  'New appointment',
  'New quote',
  'New payment',
  'Payment failed',
  'Quote accepted',
  'Quote declined',
  'Quote expired',
  'Appointment canceled',
  'Appointment updated',
  'Upcoming appointment',
  'New review',
  'Customer update',
  'Billing update',
  'Update',
]);

/**
 * One-line inbox copy: stable, short, no service names. Uses `type` + `reference_type`
 * heuristics; falls back to a trimmed server `title` when unknown.
 *
 * @param {string | undefined} type
 * @param {string | undefined} referenceType
 * @param {string | undefined} fallbackTitle
 */
export function notificationMinimalDisplayTitle(type, referenceType, fallbackTitle) {
  const blob = `${type ?? ''} ${referenceType ?? ''}`.toLowerCase();

  if (blob.includes('payment') && blob.includes('fail')) {
    return 'Payment failed';
  }
  if (
    blob.includes('payment') ||
    blob.includes('payout') ||
    blob.includes('deposit') ||
    blob.includes('refund') ||
    blob.includes('invoice')
  ) {
    return 'New payment';
  }

  if (blob.includes('quote')) {
    if (blob.includes('accept')) {
      return 'Quote accepted';
    }
    if (blob.includes('decline') || blob.includes('reject')) {
      return 'Quote declined';
    }
    if (blob.includes('expire')) {
      return 'Quote expired';
    }
    return 'New quote';
  }

  if (blob.includes('cancel')) {
    return 'Appointment canceled';
  }
  if (blob.includes('reschedule') || blob.includes('rescheduled')) {
    return 'Appointment updated';
  }
  if (blob.includes('reminder')) {
    return 'Upcoming appointment';
  }
  if (blob.includes('review')) {
    return 'New review';
  }
  if (blob.includes('booking') || blob.includes('appointment')) {
    return 'New appointment';
  }

  if (blob.includes('customer')) {
    return 'Customer update';
  }
  if (blob.includes('subscription') || blob.includes('billing')) {
    return 'Billing update';
  }

  const trimmed = (fallbackTitle ?? '').trim();
  if (!trimmed) {
    return 'Update';
  }
  const max = 52;
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, max - 1)}…`;
}
