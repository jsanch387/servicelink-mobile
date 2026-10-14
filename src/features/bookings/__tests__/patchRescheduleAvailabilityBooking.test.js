import {
  applyRescheduleDisplayToBookingRow,
  patchRescheduleAvailabilityBooking,
} from '../api/patchRescheduleAvailabilityBooking';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('patchRescheduleAvailabilityBooking', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('PATCHes the new slot with Bearer auth and no status', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          id: 'booking-1',
          status: 'confirmed',
          date: '2026-08-20',
          startTimeHHmm: '14:30',
          time: '2:30 PM',
          customerName: 'Jane Doe',
          serviceName: 'Exterior Wash',
        },
      }),
    });

    const result = await patchRescheduleAvailabilityBooking('token-1', 'booking-1', {
      scheduledDate: '2026-08-20',
      startTime: '14:30',
    });

    expect(result).toEqual({
      ok: true,
      booking: {
        id: 'booking-1',
        status: 'confirmed',
        date: '2026-08-20',
        startTimeHHmm: '14:30',
        time: '2:30 PM',
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
        body: JSON.stringify({ scheduledDate: '2026-08-20', startTime: '14:30' }),
      }),
    );
  });

  it('returns the server error message on 409', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        success: false,
        error: 'That time overlaps time you marked unavailable. Choose a different slot.',
      }),
    });

    const result = await patchRescheduleAvailabilityBooking('token-1', 'booking-1', {
      scheduledDate: '2026-08-20',
      startTime: '14:30',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(
        'That time overlaps time you marked unavailable. Choose a different slot.',
      );
      expect(result.httpStatus).toBe(409);
    }
  });

  it('rejects missing auth token', async () => {
    const result = await patchRescheduleAvailabilityBooking(null, 'booking-1', {
      scheduledDate: '2026-08-20',
      startTime: '14:30',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/signed in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('applyRescheduleDisplayToBookingRow', () => {
  it('writes scheduled_date and start_time from the display payload', () => {
    expect(
      applyRescheduleDisplayToBookingRow(
        {
          id: 'booking-1',
          scheduled_date: '2026-08-01',
          start_time: '09:00:00',
          status: 'confirmed',
        },
        { date: '2026-08-20', startTimeHHmm: '14:30', time: '2:30 PM', status: 'confirmed' },
      ),
    ).toEqual({
      id: 'booking-1',
      scheduled_date: '2026-08-20',
      start_time: '14:30:00',
      status: 'confirmed',
    });
  });

  it('falls back to the display clock when startTimeHHmm is missing', () => {
    expect(
      applyRescheduleDisplayToBookingRow(
        { scheduled_date: '2026-08-01', start_time: '09:00:00' },
        { date: '2026-08-20', time: '2:30 PM', status: 'confirmed' },
      ),
    ).toMatchObject({
      scheduled_date: '2026-08-20',
      start_time: '14:30:00',
    });
  });
});
