import { buildSubmitStatusMessages, SUBMIT_STATUS_COPY } from '../utils/submitStatusMessages';

describe('buildSubmitStatusMessages', () => {
  it('includes notifying copy when customer has a phone', () => {
    expect(buildSubmitStatusMessages({ shouldNotifyCustomer: true })).toEqual([
      SUBMIT_STATUS_COPY.submitting,
      SUBMIT_STATUS_COPY.saving,
      SUBMIT_STATUS_COPY.calendar,
      SUBMIT_STATUS_COPY.notifying,
      SUBMIT_STATUS_COPY.finishing,
    ]);
  });

  it('uses confirming copy when customer has no phone', () => {
    expect(buildSubmitStatusMessages({ shouldNotifyCustomer: false })).toEqual([
      SUBMIT_STATUS_COPY.submitting,
      SUBMIT_STATUS_COPY.saving,
      SUBMIT_STATUS_COPY.calendar,
      SUBMIT_STATUS_COPY.confirming,
      SUBMIT_STATUS_COPY.finishing,
    ]);
  });
});
