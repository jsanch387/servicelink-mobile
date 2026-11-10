import {
  APPOINTMENT_REQUEST_EXPIRED_ERROR,
  isAppointmentRequestExpiredError,
  patchApproveAvailabilityBooking,
} from '../api/patchApproveAvailabilityBooking';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('patchApproveAvailabilityBooking', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('PATCHes status confirmed with Bearer auth and no schedule fields', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          id: 'booking-1',
          status: 'confirmed',
          date: '2026-12-20',
          time: '9 AM',
          startTimeHHmm: '09:00',
          customerName: 'Jane Doe',
          serviceName: 'Full detail',
        },
      }),
    });

    const result = await patchApproveAvailabilityBooking('token-1', 'booking-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.status).toBe('confirmed');
      expect(result.booking.id).toBe('booking-1');
    }
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ status: 'confirmed' }),
      }),
    );
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ status: 'confirmed' });
    expect(body.scheduledDate).toBeUndefined();
    expect(body.startTime).toBeUndefined();
  });

  it('keeps the server expiry message on 409', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: APPOINTMENT_REQUEST_EXPIRED_ERROR }),
    });

    const result = await patchApproveAvailabilityBooking('token-1', 'booking-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
      expect(isAppointmentRequestExpiredError(result.error)).toBe(true);
    }
  });

  it('returns other server errors without changing the request', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'Forbidden' }),
    });

    const result = await patchApproveAvailabilityBooking('token-1', 'booking-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Forbidden');
      expect(result.httpStatus).toBe(403);
    }
  });

  it('rejects missing auth token', async () => {
    const result = await patchApproveAvailabilityBooking(null, 'booking-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/signed in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
