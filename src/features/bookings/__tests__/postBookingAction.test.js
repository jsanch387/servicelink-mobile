import { mapBookingActionHttpError, postBookingAction } from '../api/postBookingAction';
import { BOOKING_ACTION } from '../constants/jobStatus';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postBookingAction', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('posts job_started to the booking actions endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'job_started',
        jobStatus: 'in_progress',
        sms: { sent: true, messageId: 'sms-uuid-2' },
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_STARTED);

    expect(result).toEqual({
      ok: true,
      requestId: expect.any(String),
      action: 'job_started',
      jobStatus: 'in_progress',
      bookingStatus: null,
      workHandoffStatus: null,
      invoicePublicToken: null,
      smsSent: true,
      smsReason: null,
      emailSent: false,
      emailReason: null,
      messageId: 'sms-uuid-2',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/actions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'job_started' }),
      }),
    );
  });

  it('parses email outcome on job_completed', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'job_completed',
        jobStatus: 'completed',
        bookingStatus: 'completed',
        sms: { sent: false, reason: 'no_phone' },
        email: { sent: true, messageId: 'email-uuid-1' },
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_COMPLETED);

    expect(result).toEqual({
      ok: true,
      requestId: expect.any(String),
      action: 'job_completed',
      jobStatus: 'completed',
      bookingStatus: 'completed',
      workHandoffStatus: null,
      invoicePublicToken: null,
      smsSent: false,
      smsReason: 'no_phone',
      emailSent: true,
      emailReason: null,
      messageId: null,
    });
  });

  it('posts work_finished with notify flag', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'work_finished',
        jobStatus: 'in_progress',
        workHandoffStatus: 'notified',
        sms: { sent: true, messageId: 'sms-wf-1' },
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.WORK_FINISHED, {
      notify: true,
    });

    expect(result).toEqual({
      ok: true,
      requestId: expect.any(String),
      action: 'work_finished',
      jobStatus: 'in_progress',
      bookingStatus: null,
      workHandoffStatus: 'notified',
      invoicePublicToken: null,
      smsSent: true,
      smsReason: null,
      emailSent: false,
      emailReason: null,
      messageId: 'sms-wf-1',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/actions',
      expect.objectContaining({
        body: JSON.stringify({ action: 'work_finished', notify: true }),
      }),
    );
  });

  it('posts work_finished skip without notify SMS', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'work_finished',
        jobStatus: 'in_progress',
        workHandoffStatus: 'skipped',
        sms: { sent: false, messageId: null, reason: null },
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.WORK_FINISHED, {
      notify: false,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ action: 'work_finished', notify: false }),
      }),
    );
    if (result.ok) {
      expect(result.workHandoffStatus).toBe('skipped');
    }
  });

  it('posts job_completed with session fees and payment', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'job_completed',
        jobStatus: 'completed',
        bookingStatus: 'completed',
        workHandoffStatus: 'skipped',
        invoicePublicToken: null,
        sms: { sent: true, messageId: 'sms-complete-1' },
        email: { sent: false, reason: null },
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_COMPLETED, {
      sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
      sessionPayment: { method: 'cash', amountCents: 12000 },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/actions',
      expect.objectContaining({
        body: JSON.stringify({
          action: 'job_completed',
          sessionFees: [{ label: 'Pet hair', amountCents: 2500 }],
          sessionPayment: { method: 'cash', amountCents: 12000 },
        }),
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.invoicePublicToken).toBeNull();
      expect(result.workHandoffStatus).toBe('skipped');
    }
  });

  it('parses invoicePublicToken when present', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'job_completed',
        jobStatus: 'completed',
        bookingStatus: 'completed',
        invoicePublicToken: 'inv_public_abc',
        sms: { sent: true, messageId: 'sms-1' },
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_COMPLETED);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.invoicePublicToken).toBe('inv_public_abc');
    }
  });

  it('parses bookingStatus on job_completed', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'job_completed',
        jobStatus: 'completed',
        bookingStatus: 'completed',
        sms: { sent: true, messageId: 'sms-1' },
        email: { sent: false, reason: null },
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_COMPLETED);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bookingStatus).toBe('completed');
    }
  });

  it('maps success:false on 200 to an error result', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: false,
        error: 'Invalid transition',
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_STARTED);

    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(200);
    expect(result.error?.message).toBe('Invalid transition');
  });

  it('maps 400 payment due error for job_completed', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      headers: { get: () => null },
      json: async () => ({
        success: false,
        error: 'Payment is still due on this booking.',
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_COMPLETED, {
      sessionPayment: { method: 'cash', amountCents: 0 },
    });

    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(400);
    expect(result.error?.message).toBe('Payment is still due on this booking.');
  });

  it('maps 409 handoff pending with server message', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      headers: { get: () => null },
      json: async () => ({
        success: false,
        error: 'Mark work done before completing this booking.',
      }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_COMPLETED);

    expect(result.httpStatus).toBe(409);
    expect(result.error?.message).toBe('Mark work done before completing this booking.');
  });

  it('maps 429 with Retry-After', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: (name) => (name === 'Retry-After' ? '30' : null) },
      json: async () => ({ success: false, error: 'Too many requests' }),
    });

    const result = await postBookingAction('token', 'booking-1', BOOKING_ACTION.JOB_STARTED);

    expect(result.ok).toBe(false);
    expect(result.retryAfterSec).toBe(30);
  });
});

describe('mapBookingActionHttpError', () => {
  it('uses server message when provided', () => {
    expect(mapBookingActionHttpError(400, 'Payment is still due on this booking.')).toBe(
      'Payment is still due on this booking.',
    );
  });

  it('falls back for 409', () => {
    expect(mapBookingActionHttpError(409, null)).toBe(
      'This action is not available for this appointment.',
    );
  });
});
