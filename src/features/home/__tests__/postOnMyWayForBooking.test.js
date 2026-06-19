import { postOnMyWayForBooking } from '../api/postOnMyWayForBooking';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postOnMyWayForBooking', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('posts on_the_way to the booking actions endpoint', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({
        success: true,
        action: 'on_the_way',
        jobStatus: 'on_the_way',
        sms: { sent: true, messageId: 'sms-uuid-1' },
      }),
    });

    const result = await postOnMyWayForBooking('token', 'booking-1');

    expect(result).toEqual({
      ok: true,
      requestId: expect.any(String),
      action: 'on_the_way',
      jobStatus: 'on_the_way',
      bookingStatus: null,
      workHandoffStatus: null,
      invoicePublicToken: null,
      smsSent: true,
      smsReason: null,
      messageId: 'sms-uuid-1',
      emailSent: false,
      emailReason: null,
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/booking-1/actions',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'on_the_way' }),
      }),
    );
  });
});
