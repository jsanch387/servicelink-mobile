import { Alert } from 'react-native';

/**
 * **Standard error UI (going forward)**
 *
 * 1. **Inline / section errors** — Use shared `InlineCardError` with `message={...}`. It runs
 *    `safeUserFacingMessage` internally, so you can pass hook/query error strings safely.
 * 2. **Blocking alerts** (save failed, action failed) — Prefer `showUserFacingErrorAlert(title, err)`
 *    instead of `Alert.alert(title, err.message)` so copy is always sanitized.
 * 3. **Domain-specific copy** (optional) — e.g. `getPaymentSaveUserMessage` for payments, then pass
 *    the result to `InlineCardError` or an alert body.
 *
 * Sanitization blocks common PII/identifier patterns and verbose DB/API text in user-visible strings.
 * Not a substitute for server-side access control.
 */

const DEFAULT_FALLBACK = 'Something went wrong. Please try again.';

/** RN / fetch when offline or DNS fails — never show raw `TypeError` to users */
const NETWORK_USER_MESSAGE =
  "Can't connect right now. Check your internet and pull down to refresh.";

/** DB / PostgREST / auth internals that should not be shown to end users */
const INTERNAL_DETAIL =
  /\b(relation|column|constraint|duplicate key|violates|pg_|sqlstate|postgrest|pgrst|invalid input syntax|permission denied for|JWT expired|refresh_token|access_token|bearer\s+[a-z0-9._-]{20,})\b/i;

const UUID_IN_TEXT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const LOOKS_LIKE_JWT = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./;

/**
 * @param {unknown} source
 * @param {{ fallback?: string }} [options]
 * @returns {string}
 */
export function safeUserFacingMessage(source, options = {}) {
  const fallback = options.fallback ?? DEFAULT_FALLBACK;

  let raw = '';
  if (source == null) {
    return fallback;
  }
  if (typeof source === 'string') {
    raw = source;
  } else if (typeof source === 'object' && source !== null && 'message' in source) {
    const m = source.message;
    raw = typeof m === 'string' ? m : '';
  } else {
    raw = String(source);
  }

  const text = raw.trim();
  if (!text) {
    return fallback;
  }

  const lower = text.toLowerCase();
  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    /\btypeerror\b.*\bnetwork\b/i.test(text) ||
    (lower.includes('typeerror') && (lower.includes('network') || lower.includes('fetch'))) ||
    (lower.includes('network') && (lower.includes('failed') || lower.includes('error'))) ||
    /\bnet::err_/i.test(text) ||
    lower.includes('internet connection') ||
    lower.includes('the internet connection appears to be offline')
  ) {
    return NETWORK_USER_MESSAGE;
  }

  if (text.length > 220) {
    return fallback;
  }

  if (text.includes('@')) {
    return fallback;
  }

  /** Bare `TypeError` without useful context — avoid showing JS error class names */
  if (/^typeerror\b/i.test(text) && text.length < 120) {
    return fallback;
  }

  if (INTERNAL_DETAIL.test(text)) {
    return fallback;
  }

  if (UUID_IN_TEXT.test(text)) {
    return fallback;
  }

  if (LOOKS_LIKE_JWT.test(text)) {
    return fallback;
  }

  const digitCount = (text.match(/\d/g) ?? []).length;
  if (digitCount >= 10 && /\d{3}[^\d]{0,4}\d{3}[^\d]{0,4}\d{4}/.test(text.replace(/\s/g, ' '))) {
    return fallback;
  }

  if (text.length > 48 && /^[A-Za-z0-9+/=_-]+$/.test(text)) {
    return fallback;
  }

  return text;
}

/**
 * `Alert.alert` with a message that always passes through `safeUserFacingMessage`.
 *
 * @param {string} title
 * @param {unknown} errorOrMessage
 * @param {{ fallback?: string; buttons?: import('react-native').AlertButton[]; options?: import('react-native').AlertOptions }} [config]
 */
export function showUserFacingErrorAlert(title, errorOrMessage, config = {}) {
  const message = safeUserFacingMessage(errorOrMessage, { fallback: config.fallback });
  const { buttons, options } = config;
  if (buttons?.length) {
    Alert.alert(title, message, buttons, options);
  } else {
    Alert.alert(title, message, undefined, options);
  }
}
