/**
 * Dev-only Tap to Pay diagnostics for Metro.
 * Never log secrets (client secrets, connection tokens, full auth headers).
 */

/**
 * @param {unknown} value
 * @returns {string}
 */
function maskId(value) {
  const text = String(value ?? '').trim();
  if (!text) {
    return '(empty)';
  }
  if (text.length <= 10) {
    return text;
  }
  return `${text.slice(0, 8)}…${text.slice(-4)}`;
}

/**
 * @param {Record<string, unknown> | undefined} details
 * @returns {string}
 */
function formatDetails(details) {
  if (!details || Object.keys(details).length === 0) {
    return '';
  }

  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (typeof value === 'object') {
        try {
          return `${key}=${JSON.stringify(value)}`;
        } catch {
          return `${key}=[object]`;
        }
      }
      return `${key}=${value}`;
    })
    .join(' ');
}

/**
 * @param {string} event
 * @param {Record<string, unknown>} [details]
 */
export function logTapToPayDebug(event, details = {}) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const suffix = formatDetails(details);
  console.log(suffix ? `[TapToPay] ${event} ${suffix}` : `[TapToPay] ${event}`);
}

/**
 * @param {string} stage
 * @param {{ message?: string; httpStatus?: number; requestId?: string; [key: string]: unknown }} [details]
 */
export function logTapToPayFailure(stage, details = {}) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  const suffix = formatDetails(details);
  console.warn(suffix ? `[TapToPay:${stage}] ${suffix}` : `[TapToPay:${stage}]`);
}

export { maskId };
