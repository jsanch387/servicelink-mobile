import {
  APPOINTMENT_REQUEST_EXPIRED_ERROR,
  isAppointmentRequestExpiredError,
} from '../api/patchApproveAvailabilityBooking';
import { patchDenyAvailabilityBooking } from '../api/patchDenyAvailabilityBooking';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('patchDenyAvailabilityBooking', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('PATCHes status cancelled with Bearer auth and no schedule fields', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          id: 'booking-1',
          status: 'cancelled',
          date: '2026-12-20',
          time: '9 AM',
          startTimeHHmm: '09:00',
          customerName: 'Jane Doe',
          serviceName: 'Full detail',
        },
      }),
    });

    const result = await patchDenyAvailabilityBooking('token-1', 'booking-1');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.status).toBe('cancelled');
      expect(result.booking.id).toBe('booking-1');
    }
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ status: 'cancelled' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('keeps the server expiry message on 409', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: APPOINTMENT_REQUEST_EXPIRED_ERROR }),
    });

    const result = await patchDenyAvailabilityBooking('token-1', 'booking-1');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
      expect(isAppointmentRequestExpiredError(result.error)).toBe(true);
    }
  });

  it('rejects missing auth token', async () => {
    const result = await patchDenyAvailabilityBooking(null, 'booking-1');
    expect(result.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
