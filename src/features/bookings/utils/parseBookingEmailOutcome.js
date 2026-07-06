/**
 * Reads optional email delivery metadata from booking API JSON payloads.
 * Server may attach `email` at the root or under `data`.
 *
 * @param {unknown} payload
 * @returns {{ sent: boolean; reason: string | null; messageId: string | null } | null}
 */
export function parseBookingEmailOutcome(payload) {
  const dataObj = payload?.data && typeof payload.data === 'object' ? payload.data : null;
  const email =
    (payload?.email && typeof payload.email === 'object' ? payload.email : null) ??
    (dataObj?.email && typeof dataObj.email === 'object' ? dataObj.email : null);

  if (!email) {
    return null;
  }

  return {
    sent: email.sent === true,
    reason: typeof email.reason === 'string' ? email.reason : null,
    messageId:
      typeof email.messageId === 'string'
        ? email.messageId
        : typeof email.message_id === 'string'
          ? email.message_id
          : null,
  };
}
