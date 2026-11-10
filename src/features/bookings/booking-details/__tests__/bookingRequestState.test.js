import {
  BOOKING_REQUEST_EXPIRED_COPY,
  BOOKING_REQUEST_PENDING_COPY,
  bookingRequestState,
} from '../utils/bookingRequestState';

const today = '2026-11-09';

describe('bookingRequestState', () => {
  it('shows approve and deny copy for a request on today or later', () => {
    expect(
      bookingRequestState({ status: 'requested', scheduledDate: '2026-11-09', today }),
    ).toEqual({ kind: 'pending', message: BOOKING_REQUEST_PENDING_COPY });
    expect(
      bookingRequestState({ status: 'requested', scheduledDate: '2026-11-10', today }),
    ).toEqual({ kind: 'pending', message: BOOKING_REQUEST_PENDING_COPY });
  });

  it('treats a past requested date as expired', () => {
    expect(
      bookingRequestState({ status: 'requested', scheduledDate: '2026-11-08', today }),
    ).toEqual({ kind: 'expired', message: BOOKING_REQUEST_EXPIRED_COPY });
  });

  it('shows the expired copy for an expired status even when the date is still ahead', () => {
    expect(bookingRequestState({ status: 'expired', scheduledDate: '2026-11-12', today })).toEqual({
      kind: 'expired',
      message: BOOKING_REQUEST_EXPIRED_COPY,
    });
  });

  it('leaves confirmed, completed, and cancelled visits alone', () => {
    for (const status of ['confirmed', 'completed', 'cancelled', 'canceled']) {
      expect(bookingRequestState({ status, scheduledDate: '2026-11-09', today }).kind).toBe('none');
    }
  });
});
