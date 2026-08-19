import { patchCancelAvailabilityBooking } from '../api/patchCancelAvailabilityBooking';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('patchCancelAvailabilityBooking', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('PATCHes status cancelled with Bearer auth', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          id: 'booking-1',
          status: 'cancelled',
          scheduledDate: '2026-08-20',
          startTime: '09:00',
          customerName: 'Jane Doe',
          serviceName: 'Exterior Wash',
        },
      }),
    });

    const result = await patchCancelAvailabilityBooking('token-1', 'booking-1');

    expect(result).toEqual({
      ok: true,
      booking: {
        id: 'booking-1',
        status: 'cancelled',
        scheduledDate: '2026-08-20',
        startTime: '09:00',
        customerName: 'Jane Doe',
        serviceName: 'Exterior Wash',
      },
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ status: 'cancelled' }),
      }),
    );
  });

  it('returns server error message on failure', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ success: false, error: 'Booking not found' }),
    });

    const result = await patchCancelAvailabilityBooking('token-1', 'missing');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Booking not found');
      expect(result.httpStatus).toBe(404);
    }
  });

  it('rejects missing auth token', async () => {
    const result = await patchCancelAvailabilityBooking(null, 'booking-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/signed in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
