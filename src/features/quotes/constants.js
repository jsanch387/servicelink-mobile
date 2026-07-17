/** Route / mock param: inbound quote request vs sent quote. */
export const QUOTE_DETAIL_KIND_REQUEST = 'request';
export const QUOTE_DETAIL_KIND_SENT = 'sent';

export const QUOTES_FILTER_NEEDS_ACTION = 'needs_action';
export const QUOTES_FILTER_WAITING = 'waiting';
export const QUOTES_FILTER_APPROVED = 'approved';

/** Task-based quote lifecycle filters for the owner inbox. */
export const QUOTES_FILTER_OPTIONS = [
  { key: QUOTES_FILTER_NEEDS_ACTION, label: 'Needs action' },
  { key: QUOTES_FILTER_WAITING, label: 'Waiting' },
  { key: QUOTES_FILTER_APPROVED, label: 'Approved' },
];

/** Shown when detail fetch finds no row (deleted, stale list, or sync delay). */
export const QUOTE_DETAIL_NOT_FOUND_USER_MESSAGE =
  'This quote is not in your inbox anymore. It may have already been removed, or the list needs a refresh. Go back to Quotes and pull down to update the list.';

/** Technical errors (network, RLS) — keep separate from “gone” copy. */
export const QUOTE_DETAIL_LOAD_FAILED_USER_MESSAGE =
  'We could not open this quote. Check your connection, then go back and try again.';
