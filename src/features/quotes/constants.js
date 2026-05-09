/** Route / mock param: inbound quote request vs sent quote. */
export const QUOTE_DETAIL_KIND_REQUEST = 'request';
export const QUOTE_DETAIL_KIND_SENT = 'sent';

/** @type {const} */
export const QUOTES_TAB_REQUESTS = 'requests';

/** Outgoing quotes: sent to the customer, pending acceptance (then become bookings). */
export const QUOTES_TAB_SENT = 'sent';

export const QUOTES_TAB_OPTIONS = [
  { key: QUOTES_TAB_REQUESTS, label: 'Quote requests' },
  { key: QUOTES_TAB_SENT, label: 'Sent quotes' },
];

/** Shown when detail fetch finds no row (deleted, stale list, or sync delay). */
export const QUOTE_DETAIL_NOT_FOUND_USER_MESSAGE =
  'This quote is not in your inbox anymore. It may have already been removed, or the list needs a refresh. Go back to Quotes and pull down to update the list.';

/** Technical errors (network, RLS) — keep separate from “gone” copy. */
export const QUOTE_DETAIL_LOAD_FAILED_USER_MESSAGE =
  'We could not open this quote. Check your connection, then go back and try again.';
