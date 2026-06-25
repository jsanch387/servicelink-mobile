import { provisionTapToPayMerchantSetup } from '../api/provisionTapToPayMerchantSetup';
import { postTapToPayMerchantConnectionToken } from '../api/postTapToPayMerchantConnectionToken';

jest.mock('../api/postTapToPayMerchantConnectionToken', () => ({
  postTapToPayMerchantConnectionToken: jest.fn(),
}));

describe('provisionTapToPayMerchantSetup', () => {
  beforeEach(() => {
    postTapToPayMerchantConnectionToken.mockReset();
  });

  it('refetches dashboard after merchant connection token succeeds', async () => {
    postTapToPayMerchantConnectionToken.mockResolvedValue({
      ok: true,
      secret: 'pst_test',
      requestId: 'req-1',
    });
    const refetchPayments = jest.fn().mockResolvedValue({
      data: {
        paymentAccount: {
          stripe_terminal_location_id: 'tml_123',
        },
      },
    });

    const result = await provisionTapToPayMerchantSetup({
      accessToken: 'token',
      stripeAccountId: 'acct_123',
      refetchPayments,
    });

    expect(result).toEqual({ ok: true, terminalLocationId: 'tml_123' });
    expect(postTapToPayMerchantConnectionToken).toHaveBeenCalledWith('token', {
      stripeAccountId: 'acct_123',
    });
    expect(refetchPayments).toHaveBeenCalledTimes(1);
  });

  it('returns error when merchant connection token fails', async () => {
    postTapToPayMerchantConnectionToken.mockResolvedValue({
      ok: false,
      error: new Error('Setup failed'),
      httpStatus: 422,
    });

    const result = await provisionTapToPayMerchantSetup({
      accessToken: 'token',
      stripeAccountId: 'acct_123',
      refetchPayments: jest.fn(),
    });

    expect(result.ok).toBe(false);
    expect(result.terminalLocationId).toBeNull();
  });
});
