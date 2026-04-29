/**
 * Dedupe home dashboard errors so we don't show the same red banner in every card.
 *
 * @param {{
 *   businessError: string | null;
 *   bookingsError: string | null;
 *   todayBookingsError: string | null;
 * }} args
 * @returns {{
 *   bannerError: string | null;
 *   nextUpBusinessError: string | null;
 *   nextUpBookingsError: string | null;
 *   linkBusinessError: string | null;
 *   linkSectionDegraded: boolean;
 *   restOfTodayError: string | null;
 * }}
 */
export function computeHomeErrorPresentation({ businessError, bookingsError, todayBookingsError }) {
  const key = homeErrorDedupKey;

  if (businessError) {
    const bk = key(businessError);
    return {
      bannerError: businessError,
      nextUpBusinessError: null,
      nextUpBookingsError: bookingsError && key(bookingsError) !== bk ? bookingsError : null,
      linkBusinessError: null,
      linkSectionDegraded: true,
      restOfTodayError:
        todayBookingsError && key(todayBookingsError) !== bk ? todayBookingsError : null,
    };
  }

  const bke = bookingsError ?? null;
  const te = todayBookingsError ?? null;
  if (bke && te && key(bke) === key(te)) {
    return {
      bannerError: bke,
      nextUpBusinessError: null,
      nextUpBookingsError: null,
      linkBusinessError: null,
      linkSectionDegraded: false,
      restOfTodayError: null,
    };
  }

  return {
    bannerError: null,
    nextUpBusinessError: null,
    nextUpBookingsError: bke,
    linkBusinessError: null,
    restOfTodayError: te,
  };
}

/**
 * Normalize fetch/network errors so "TypeError: Network request failed" matches across queries.
 * @param {string | null | undefined} message
 * @returns {string}
 */
export function homeErrorDedupKey(message) {
  if (message == null) return '';
  let s = String(message).trim();
  s = s.replace(/^typeerror:\s*/i, '');
  s = s.toLowerCase();
  if (s.includes('network request failed') || /\bfailed to fetch\b/.test(s)) {
    return '__network__';
  }
  if (s.includes('network') && (s.includes('error') || s.includes('fail'))) {
    return '__network__';
  }
  return s.slice(0, 200);
}
