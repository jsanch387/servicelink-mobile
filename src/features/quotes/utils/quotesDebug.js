/**
 * Quotes feature diagnostics — dev / debug builds only (`__DEV__`).
 * Use for API-style breadcrumbs (Supabase + send-quote HTTP): start/ok/fail tags,
 * ids and HTTP status — not full payloads (avoid PII in logs).
 */

/**
 * @param {import('@supabase/supabase-js').PostgrestError | Error | null | undefined} err
 */
export function quotesFormatSupabaseError(err) {
  if (!err) return null;
  const o = /** @type {Record<string, unknown>} */ (err);
  return {
    name: err instanceof Error ? err.name : 'PostgrestError',
    message: String(o.message ?? err),
    code: o.code != null ? String(o.code) : undefined,
    details: o.details != null ? String(o.details) : undefined,
    hint: o.hint != null ? String(o.hint) : undefined,
  };
}

/**
 * @param {string} tag
 * @param {unknown} [data]
 */
export function quotesDebug(tag, data) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[quotes:${tag}]`, data ?? '');
  }
}

/**
 * @param {string} tag
 * @param {string} message
 * @param {unknown} [extra]
 */
export function quotesDebugWarn(tag, message, extra) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(`[quotes:${tag}] ${message}`, extra ?? '');
  }
}

/**
 * @param {string} tag
 * @param {string} message
 * @param {unknown} [extra]
 */
export function quotesDebugError(tag, message, extra) {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error(`[quotes:${tag}] ${message}`, extra ?? '');
  }
}
