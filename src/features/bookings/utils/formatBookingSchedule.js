import { formatStartsRelative, parseBookingStartLocalMs } from '../../home/utils/bookingStart';

/**
 * @param {string} scheduledDate
 * @param {string} startTime
 * @param {number} [nowMs]
 * @param {{ variant?: 'dateTime' | 'timeOnly' }} [options] — `timeOnly` when a section header already shows the date.
 * @returns {{ dateTimeLine: string; relativeLine: string }}
 */
export function formatBookingCardSchedule(
  scheduledDate,
  startTime,
  nowMs = Date.now(),
  options = {},
) {
  const variant = options.variant ?? 'dateTime';
  const ms = parseBookingStartLocalMs(scheduledDate, startTime);
  if (!Number.isFinite(ms)) {
    return { dateTimeLine: '—', relativeLine: '' };
  }
  const d = new Date(ms);
  const dateTimeLine =
    variant === 'timeOnly'
      ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
  const relativeLine = formatStartsRelative(ms, nowMs);
  return { dateTimeLine, relativeLine };
}
