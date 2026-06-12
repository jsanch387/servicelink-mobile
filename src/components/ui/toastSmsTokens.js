/** Outbound confirmation toasts — white card, black text, channel icon. */
export const TOAST_SMS_TOKENS = Object.freeze({
  success: {
    text: '#171717',
    icon: 'chatbubble-ellipses',
  },
  info: {
    text: '#171717',
    icon: 'information-circle',
  },
  error: {
    text: '#dc2626',
    icon: 'alert-circle',
  },
});

/**
 * @param {'success' | 'error' | 'info' | 'loading'} type
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
    text: '#171717',
    icon: 'mail-outline',
  },
});

/**
 * @param {'success' | 'error' | 'info' | 'loading'} type
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
