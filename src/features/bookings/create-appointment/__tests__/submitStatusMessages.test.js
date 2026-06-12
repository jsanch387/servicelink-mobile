import { buildSubmitStatusMessages, SUBMIT_STATUS_COPY } from '../utils/submitStatusMessages';

describe('buildSubmitStatusMessages', () => {
  it('includes notifying copy when customer has a phone', () => {
    expect(buildSubmitStatusMessages({ hasCustomerPhone: true })).toEqual([
      SUBMIT_STATUS_COPY.submitting,
      SUBMIT_STATUS_COPY.calendar,
      SUBMIT_STATUS_COPY.notifying,
    ]);
  });

  it('omits notifying copy when customer has no phone', () => {
    expect(buildSubmitStatusMessages({ hasCustomerPhone: false })).toEqual([
      SUBMIT_STATUS_COPY.submitting,
      SUBMIT_STATUS_COPY.calendar,
    ]);
  });
});
