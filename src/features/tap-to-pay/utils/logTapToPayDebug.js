/**
 * Tap to Pay logging tiers:
 * - `logTapToPayInfo` / `logTapToPayFailure` — always on (TestFlight + App Store).
 * - `logTapToPayDebug` — verbose diagnostics; dev only when
 *   `EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS=true`.
 *
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

function isVerboseLoggingEnabled() {
  return (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    String(process.env.EXPO_PUBLIC_TAP_TO_PAY_VERBOSE_LOGS ?? '').trim() === 'true'
  );
}

/**
 * @param {'log' | 'warn'} level
 * @param {string} prefix
 * @param {string} event
 * @param {Record<string, unknown>} details
 */
function emitTapToPayLog(level, prefix, event, details = {}) {
  const suffix = formatDetails(details);
  const line = suffix ? `[TapToPay${prefix}] ${event} ${suffix}` : `[TapToPay${prefix}] ${event}`;
  if (level === 'warn') {
    console.warn(line);
    return;
  }
  console.log(line);
}

/**
 * Verbose diagnostics (warmup, connect skips, API traces). Dev-only + env flag.
 *
 * @param {string} event
 * @param {Record<string, unknown>} [details]
 */
export function logTapToPayDebug(event, details = {}) {
  if (!isVerboseLoggingEnabled()) {
    return;
  }
  emitTapToPayLog('log', '', event, details);
}

/**
 * Important lifecycle events — payment success, enablement, intent ready.
 *
 * @param {string} event
 * @param {Record<string, unknown>} [details]
 */
export function logTapToPayInfo(event, details = {}) {
  emitTapToPayLog('log', '', event, details);
}

/**
 * Failures — always logged so TestFlight / production issues are visible.
 *
 * @param {string} stage
 * @param {{ message?: string; httpStatus?: number; requestId?: string; [key: string]: unknown }} [details]
 */
export function logTapToPayFailure(stage, details = {}) {
  const suffix = formatDetails(details);
  const line = suffix ? `[TapToPay:${stage}] ${suffix}` : `[TapToPay:${stage}]`;
  console.warn(line);
}

export { maskId };
