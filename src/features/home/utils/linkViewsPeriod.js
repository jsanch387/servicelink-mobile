import { LINK_VIEWS_DEFAULT_PERIOD } from '../constants/linkViews';

/**
 * Rolling window start for link view counts (matches web dashboard).
 *
 * @param {'24h' | '7d' | '30d'} period
 * @returns {string} ISO timestamp
 */
export function periodToSinceIso(period) {
  const now = Date.now();
  const ms =
    period === '24h'
      ? 24 * 60 * 60 * 1000
      : period === '7d'
        ? 7 * 24 * 60 * 60 * 1000
        : 30 * 24 * 60 * 60 * 1000;
  return new Date(now - ms).toISOString();
}

/**
 * Free users always query 24h even if UI state is 7d/30d.
 *
 * @param {'24h' | '7d' | '30d'} period
 * @param {boolean} hasProAccess
 * @returns {'24h' | '7d' | '30d'}
 */
export function resolveEffectiveLinkViewsPeriod(period, hasProAccess) {
  if (hasProAccess) {
    return period;
  }
  if (period === '7d' || period === '30d') {
    return LINK_VIEWS_DEFAULT_PERIOD;
  }
  return period;
}

/**
 * @param {'24h' | '7d' | '30d'} period
 * @returns {boolean}
 */
export function isProOnlyLinkViewsPeriod(period) {
  return period === '7d' || period === '30d';
}
