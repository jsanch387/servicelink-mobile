import { mapTapToPayHttpError } from '../utils/mapTapToPayHttpError';

describe('mapTapToPayHttpError', () => {
  it('prefers server message when provided', () => {
    expect(mapTapToPayHttpError(422, 'Finish Stripe setup to use Tap to Pay.')).toBe(
      'Finish Stripe setup to use Tap to Pay.',
    );
  });

  it('maps known status codes to defaults', () => {
    expect(mapTapToPayHttpError(400, null)).toMatch(/Nothing to collect/);
    expect(mapTapToPayHttpError(409, null)).toMatch(/Mark work done/);
    expect(mapTapToPayHttpError(422, null)).toMatch(/Set up Stripe payments/);
    expect(mapTapToPayHttpError(0, null)).toMatch(/Network error/);
  });

  it('maps merchant 404 to warm-up API missing', () => {
    expect(mapTapToPayHttpError(404, null, 'merchant')).toBe(
      'Tap to Pay warm-up API is not available on the server yet.',
    );
    expect(mapTapToPayHttpError(404, null, 'booking')).toBe('Appointment not found.');
  });
});
