import { patchBookingAssignee } from '../patchBookingAssignee';

jest.mock('../../../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('patchBookingAssignee', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('PATCHes assignedUserId with Bearer auth', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { assignedUserId: 'member-1' },
      }),
    });

    const result = await patchBookingAssignee('token-1', 'booking-1', ' member-1 ');

    expect(result).toEqual({
      ok: true,
      bookingId: 'booking-1',
      assignedUserId: 'member-1',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/assignee',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ assignedUserId: 'member-1' }),
      }),
    );
  });

  it('sends null to unassign', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { assignedUserId: null } }),
    });

    await expect(patchBookingAssignee('token-1', 'booking-1', null)).resolves.toEqual({
      ok: true,
      bookingId: 'booking-1',
      assignedUserId: null,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/assignee',
      expect.objectContaining({
        body: JSON.stringify({ assignedUserId: null }),
      }),
    );
  });

  it('does not send businessId', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { assignedUserId: 'member-1' } }),
    });

    await patchBookingAssignee('token-1', 'booking-1', 'member-1');
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual({ assignedUserId: 'member-1' });
  });

  it('maps a shop-access failure as 403', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'Not allowed' }),
    });

    const result = await patchBookingAssignee('token-1', 'booking-1', 'member-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Not allowed');
      expect(result.httpStatus).toBe(403);
    }
  });

  it('maps a completed booking as 409', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ success: false, error: 'Booking is completed' }),
    });

    const result = await patchBookingAssignee('token-1', 'booking-1', 'member-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe('Booking is completed');
      expect(result.httpStatus).toBe(409);
    }
  });

  it('rejects missing auth token', async () => {
    const result = await patchBookingAssignee(null, 'booking-1', 'member-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toMatch(/signed in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
