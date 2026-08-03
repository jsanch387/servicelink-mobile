export const SMS_QUERY_ROOT = ['sms'];

/**
 * @param {string | null | undefined} businessId
 * @returns {readonly unknown[]}
 */
export function businessSmsMessagesQueryKey(businessId) {
  return [...SMS_QUERY_ROOT, 'messages', businessId ?? null];
}
