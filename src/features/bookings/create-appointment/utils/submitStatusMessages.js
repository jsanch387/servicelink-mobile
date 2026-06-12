/** Status copy shown while a booking is being created. */
export const SUBMIT_STATUS_COPY = Object.freeze({
  submitting: 'Submitting',
  calendar: 'Adding to calendar',
  notifying: 'Notifying customer',
});

/**
 * @param {{ hasCustomerPhone?: boolean }} [options]
 * @returns {string[]}
 */
export function buildSubmitStatusMessages({ hasCustomerPhone = false } = {}) {
  const messages = [SUBMIT_STATUS_COPY.submitting, SUBMIT_STATUS_COPY.calendar];
  if (hasCustomerPhone) {
    messages.push(SUBMIT_STATUS_COPY.notifying);
  }
  return messages;
}
