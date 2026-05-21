import { toLocalYyyyMmDd } from '../../../components/ui/calendarDateKey';
import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { BOOKINGS_FILTER_PAST, BOOKINGS_FILTER_UPCOMING } from '../constants';

/** @typedef {{ start: string; end: string }} ListMonthWindow */

const MAX_FUTURE_MONTHS = 36;
const MAX_PAST_MONTHS = 60;

/**
 * @param {number} year
 * @param {number} month 0-indexed
 */
function monthEndKey(year, month) {
  return toLocalYyyyMmDd(new Date(year, month + 1, 0));
}

/**
 * @param {number} year
 * @param {number} month 0-indexed
 */
function monthStartKey(year, month) {
  return toLocalYyyyMmDd(new Date(year, month, 1));
}

/**
 * @param {import('../constants').BookingsListFilter} filter
 * @param {Date} [now]
 * @returns {ListMonthWindow}
 */
export function getInitialListMonthWindow(filter, now = new Date()) {
  const todayKey = localYyyyMmDd(now);
  const y = now.getFullYear();
  const m = now.getMonth();

  if (filter === BOOKINGS_FILTER_UPCOMING) {
    return {
      start: todayKey,
      end: monthEndKey(y, m),
    };
  }

  return {
    start: monthStartKey(y, m),
    end: todayKey,
  };
}

/**
 * @param {ListMonthWindow | { windows: ListMonthWindow[] }} pageParam
 * @returns {ListMonthWindow[]}
 */
export function listMonthWindowsFromPageParam(pageParam) {
  if (pageParam && typeof pageParam === 'object' && Array.isArray(pageParam.windows)) {
    return pageParam.windows;
  }
  return [pageParam];
}

/**
 * @param {ListMonthWindow} window
 */
function parseWindowStart(window) {
  const m = window.start.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) - 1 };
}

/**
 * @param {import('../constants').BookingsListFilter} filter
 * @param {ListMonthWindow} lastWindow
 * @returns {ListMonthWindow | null}
 */
export function getNextListMonthWindow(filter, lastWindow) {
  const parsed =
    filter === BOOKINGS_FILTER_UPCOMING
      ? parseWindowStart({ start: lastWindow.end, end: lastWindow.end })
      : parseWindowStart(lastWindow);

  if (!parsed) {
    return null;
  }

  if (filter === BOOKINGS_FILTER_UPCOMING) {
    let nextMonth = parsed.month + 1;
    let nextYear = parsed.year;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const today = new Date();
    const monthsAhead = (nextYear - today.getFullYear()) * 12 + (nextMonth - today.getMonth());
    if (monthsAhead >= MAX_FUTURE_MONTHS) {
      return null;
    }
    return {
      start: monthStartKey(nextYear, nextMonth),
      end: monthEndKey(nextYear, nextMonth),
    };
  }

  if (filter !== BOOKINGS_FILTER_PAST) {
    return null;
  }

  let prevMonth = parsed.month - 1;
  let prevYear = parsed.year;
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear -= 1;
  }
  const today = new Date();
  const monthsBack = (today.getFullYear() - prevYear) * 12 + (today.getMonth() - prevMonth);
  if (monthsBack >= MAX_PAST_MONTHS || prevYear < 2020) {
    return null;
  }
  return {
    start: monthStartKey(prevYear, prevMonth),
    end: monthEndKey(prevYear, prevMonth),
  };
}

/**
 * @param {ListMonthWindow} window
 */
export function formatListMonthWindowLabel(window) {
  const d = parseWindowStart(window);
  if (!d) return 'more';
  const date = new Date(d.year, d.month, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/**
 * @param {import('../constants').BookingsListFilter} filter
 * @param {ListMonthWindow | null} nextWindow
 */
export function getLoadMoreLabel(filter, nextWindow) {
  if (!nextWindow) {
    return '';
  }
  const label = formatListMonthWindowLabel(nextWindow);
  if (filter === BOOKINGS_FILTER_UPCOMING) {
    return `Load ${label}`;
  }
  return `Load ${label}`;
}

/** @deprecated Use {@link getLoadMoreLabel} */
export const getLoadMoreButtonTitle = getLoadMoreLabel;
