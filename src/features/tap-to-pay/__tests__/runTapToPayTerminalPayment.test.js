import { runTapToPayTerminalPayment } from '../terminal/runTapToPayTerminalPayment';

describe('runTapToPayTerminalPayment', () => {
  const baseIntent = {
    id: 'pi_test',
    amount: 5000,
    status: 'requires_payment_method',
  };

  it('shows processing only after collectPaymentMethod succeeds', async () => {
    const collectedIntent = { ...baseIntent, status: 'requires_confirmation' };
    const confirmedIntent = { ...collectedIntent, status: 'succeeded' };
    const onProcessingStart = jest.fn();
    const collectPaymentMethod = jest.fn().mockResolvedValue({
      paymentIntent: collectedIntent,
    });
    const confirmPaymentIntent = jest.fn().mockResolvedValue({
      paymentIntent: confirmedIntent,
    });

    const result = await runTapToPayTerminalPayment({
      paymentIntent: baseIntent,
      collectPaymentMethod,
      confirmPaymentIntent,
      onProcessingStart,
    });

    expect(collectPaymentMethod).toHaveBeenCalledWith({
      paymentIntent: baseIntent,
      skipTipping: true,
    });
    expect(onProcessingStart).toHaveBeenCalledTimes(1);
    expect(confirmPaymentIntent).toHaveBeenCalledWith({ paymentIntent: collectedIntent });
    expect(result).toBe(confirmedIntent);
    expect(onProcessingStart.mock.invocationCallOrder[0]).toBeLessThan(
      confirmPaymentIntent.mock.invocationCallOrder[0],
    );
  });

  it('does not show processing when collection fails', async () => {
    const onProcessingStart = jest.fn();
    const collectPaymentMethod = jest.fn().mockResolvedValue({
      error: { message: 'Payment was declined.', code: 'DECLINED' },
    });
    const confirmPaymentIntent = jest.fn();

    await expect(
      runTapToPayTerminalPayment({
        paymentIntent: baseIntent,
        collectPaymentMethod,
        confirmPaymentIntent,
        onProcessingStart,
      }),
    ).rejects.toThrow(/declined/i);

    expect(onProcessingStart).not.toHaveBeenCalled();
    expect(confirmPaymentIntent).not.toHaveBeenCalled();
  });
});
