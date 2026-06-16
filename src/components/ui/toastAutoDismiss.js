/** @typedef {import('./Toast').ToastType} ToastType */
/** @typedef {'default' | 'sms' | 'email'} ToastVariant */

/** Auto-dismiss after a readable pause; swipe up or tap still dismisses sooner. */
export const TOAST_AUTO_DISMISS_MS = {
  success: 5500,
  error: 6500,
  info: 5500,
  loading: null,
  confirmation: 7000,
};

/**
 * @param {ToastType} type
 * @param {ToastVariant} variant
 * @param {number | null | undefined} explicitDuration
 * @returns {number | null}
 */
export function resolveToastAutoDismissMs(type, variant, explicitDuration) {
  if (explicitDuration !== undefined) {
    return explicitDuration;
  }
  if (type === 'loading') {
    return null;
  }
  if (variant === 'sms' || variant === 'email') {
    return TOAST_AUTO_DISMISS_MS.confirmation;
  }
  return TOAST_AUTO_DISMISS_MS[type] ?? TOAST_AUTO_DISMISS_MS.info;
}
