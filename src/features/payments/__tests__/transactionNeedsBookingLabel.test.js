import {
  bookingLabelLookupArgs,
  transactionNeedsBookingLabel,
} from '../utils/transactionNeedsBookingLabel';

describe('transactionNeedsBookingLabel', () => {
  it('looks up when title is Mixed jobs and serviceName is also generic', () => {
    expect(
      transactionNeedsBookingLabel({
        id: 'txn_1',
        title: 'Mixed jobs',
        serviceName: 'Mixed jobs',
        bookingId: 'bk-1',
        extraCount: 1,
      }),
    ).toBe(true);
  });

  it('skips lookup when the first service is already on the row', () => {
    expect(
      transactionNeedsBookingLabel({
        id: 'txn_1',
        title: 'Mixed jobs',
        serviceName: 'Signature Shine',
        bookingId: 'bk-1',
        extraCount: 1,
      }),
    ).toBe(false);
  });

  it('collects booking and local payment ids', () => {
    expect(
      bookingLabelLookupArgs([
        {
          id: 'local_bp_pay-9',
          title: 'Double jobs',
          serviceName: '',
          extraCount: 1,
        },
        {
          id: 'txn_2',
          title: 'Mixed job jobs',
          serviceName: 'Mixed jobs',
          bookingId: 'bk-2',
          extraCount: 2,
        },
      ]),
    ).toEqual({
      bookingIds: ['bk-2'],
      paymentIds: ['pay-9'],
    });
  });
});
