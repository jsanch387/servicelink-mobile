/** @typedef {'24h' | '7d' | '30d'} LinkViewsPeriod */

/** @type {readonly LinkViewsPeriod[]} */
export const LINK_VIEWS_PERIODS = ['24h', '7d', '30d'];

/** @type {Record<LinkViewsPeriod, string>} */
export const LINK_VIEWS_PERIOD_LABELS = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
};

/** Compact label on the period dropdown trigger (top right of card). */
export const LINK_VIEWS_PERIOD_DROPDOWN_LABELS = {
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days',
};

/** @type {LinkViewsPeriod} */
export const LINK_VIEWS_DEFAULT_PERIOD = '24h';
