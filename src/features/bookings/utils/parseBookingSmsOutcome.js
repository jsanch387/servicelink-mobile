/**
 * Reads optional SMS delivery metadata from booking API JSON payloads.
 * Server may attach `sms` at the root or under `data`.
 *
 * @param {unknown} payload
 * @returns {{ sent: boolean; reason: string | null; messageId: string | null } | null}
 */
export function parseBookingSmsOutcome(payload) {
  const dataObj = payload?.data && typeof payload.data === 'object' ? payload.data : null;
  const sms =
    (payload?.sms && typeof payload.sms === 'object' ? payload.sms : null) ??
    (dataObj?.sms && typeof dataObj.sms === 'object' ? dataObj.sms : null);

  if (!sms) {
    return null;
  }

  return {
    sent: sms.sent === true,
    reason: typeof sms.reason === 'string' ? sms.reason : null,
    messageId:
      typeof sms.messageId === 'string'
        ? sms.messageId
        : typeof sms.message_id === 'string'
          ? sms.message_id
          : null,
  };
}
