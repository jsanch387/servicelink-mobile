import {
  mapOwnerManualBookingHttpError,
  postOwnerManualPublicBooking,
} from '../api/postOwnerManualPublicBooking';

jest.mock('../../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: jest.fn(() => 'http://localhost:3000'),
}));

jest.mock('../../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: jest.fn(() => null),
}));

import { productionWebApiHttpsGuard } from '../../../../lib/productionWebApiHttpsGuard';

describe('postOwnerManualPublicBooking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('returns booking id on 201', async () => {
    global.fetch.mockResolvedValue({
      status: 201,
      headers: { get: () => 'req-abc' },
      json: async () => ({ success: true, data: { id: 'book-uuid' } }),
    });

    const out = await postOwnerManualPublicBooking('jwt', { ownerManualBooking: true });

    expect(out.ok).toBe(true);
    expect(out.data).toEqual({ id: 'book-uuid' });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/public/bookings',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('returns not signed in when token missing', async () => {
    const out = await postOwnerManualPublicBooking('', {});
    expect(out.ok).toBe(false);
    expect(out.error?.message).toBe('Not signed in');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('maps 403 with server message', () => {
    expect(mapOwnerManualBookingHttpError(403, 'Free tier limit')).toBe('Free tier limit');
  });
});

describe('production guard wiring', () => {
  it('blocks when guard returns error', async () => {
    productionWebApiHttpsGuard.mockReturnValueOnce(new Error('no https'));
    const out = await postOwnerManualPublicBooking('jwt', {});
    expect(out.ok).toBe(false);
    expect(out.error?.message).toBe('no https');
  });
});
