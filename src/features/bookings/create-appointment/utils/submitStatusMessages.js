/** Status copy shown while a booking is being created. */
export const SUBMIT_STATUS_COPY = Object.freeze({
  submitting: 'Submitting appointment',
  saving: 'Saving customer details',
  calendar: 'Adding to calendar',
  notifying: 'Notifying customer',
  confirming: 'Confirming appointment',
  finishing: 'Finishing up',
});

/**
 * @param {{ shouldNotifyCustomer?: boolean }} [options]
 * @returns {string[]}
 */
export function buildSubmitStatusMessages({ shouldNotifyCustomer = false } = {}) {
  return [
    SUBMIT_STATUS_COPY.submitting,
    SUBMIT_STATUS_COPY.saving,
    SUBMIT_STATUS_COPY.calendar,
    shouldNotifyCustomer ? SUBMIT_STATUS_COPY.notifying : SUBMIT_STATUS_COPY.confirming,
    SUBMIT_STATUS_COPY.finishing,
  ];
}
