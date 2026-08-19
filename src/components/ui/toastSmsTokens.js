/** Outbound confirmation toasts — channel icon only; surface/text come from the theme. */
export const TOAST_SMS_TOKENS = Object.freeze({
  success: {
    icon: 'chatbubble-ellipses',
  },
  info: {
    icon: 'information-circle',
  },
  error: {
    icon: 'alert-circle',
  },
});

/**
 * @param {'success' | 'error' | 'info'} type
 * @returns {typeof TOAST_SMS_TOKENS.success}
 */
export function resolveToastSmsTokens(type) {
  if (type === 'error') {
    return TOAST_SMS_TOKENS.error;
  }
  if (type === 'info') {
    return TOAST_SMS_TOKENS.info;
  }
  return TOAST_SMS_TOKENS.success;
}

export const TOAST_EMAIL_TOKENS = Object.freeze({
  success: {
    icon: 'mail-outline',
  },
});

/**
 * @param {'success' | 'error' | 'info'} type
 * @returns {typeof TOAST_EMAIL_TOKENS.success}
 */
export function resolveToastEmailTokens(type) {
  if (type === 'error') {
    return TOAST_SMS_TOKENS.error;
  }
  if (type === 'info') {
    return TOAST_SMS_TOKENS.info;
  }
  return TOAST_EMAIL_TOKENS.success;
}
