import { presentPaymentsTransactionRow } from '../utils/presentPaymentsTransactionRow';

describe('presentPaymentsTransactionRow', () => {
  it('paints customer · how they paid on the left', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Lights',
        extraCount: 0,
        subtitle: 'Jordan Lee · Tap to pay',
        statusLabel: 'Paid',
      }),
    ).toEqual({
      primary: 'Lights',
      extraLabel: '',
      subtitle: 'Jordan Lee · Tap to pay',
    });
  });

  it('adds smaller +N more from extraCount', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Signature Shine',
        extraCount: 1,
        subtitle: 'Jordan Lee · Card',
        statusLabel: 'Paid',
      }),
    ).toEqual({
      primary: 'Signature Shine',
      extraLabel: '+1 more',
      subtitle: 'Jordan Lee · Card',
    });
  });

  it('still hides Mixed jobs / Double jobs if they appear', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Double jobs',
        extraCount: 1,
        subtitle: 'Pat · Tap to pay',
      }),
    ).toEqual({
      primary: '',
      extraLabel: '+1 more',
      subtitle: 'Pat · Tap to pay',
    });
  });

  it('uses the first service name instead of Mixed jobs', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Mixed jobs',
        extraCount: 1,
        serviceName: 'Signature Shine — SUV',
        subtitle: 'Jordan Lee · Card',
      }),
    ).toEqual({
      primary: 'Signature Shine',
      extraLabel: '+1 more',
      subtitle: 'Jordan Lee · Card',
    });
  });

  it('does not paint leftover jobs from Mixed job jobs', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Mixed job jobs',
        extraCount: 1,
        serviceName: 'Signature Shine',
        subtitle: 'Jordan Lee · Card',
      }),
    ).toEqual({
      primary: 'Signature Shine',
      extraLabel: '+1 more',
      subtitle: 'Jordan Lee · Card',
    });
  });

  it('drops card last four and uses methodLabel when needed', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Lights',
        extraCount: 0,
        subtitle: 'Jordan Lee · Visa •••• 4242',
        methodLabel: 'Card',
      }),
    ).toEqual({
      primary: 'Lights',
      extraLabel: '',
      subtitle: 'Jordan Lee · Card',
    });
  });

  it('does not paint a leading · when the customer is missing', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Lights',
        extraCount: 0,
        subtitle: ' · Tap to pay',
        methodLabel: 'Tap to pay',
      }),
    ).toEqual({
      primary: 'Lights',
      extraLabel: '',
      subtitle: 'Tap to pay',
    });
  });

  it('does not treat a method-only subtitle as a customer name', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Wax',
        extraCount: 0,
        subtitle: 'Cash',
      }),
    ).toEqual({
      primary: 'Wax',
      extraLabel: '',
      subtitle: 'Cash',
    });
  });

  it('drops placeholder names such as Walk-up or Customer', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Interior',
        extraCount: 0,
        subtitle: 'Walk-up · Payment link',
      }),
    ).toEqual({
      primary: 'Interior',
      extraLabel: '',
      subtitle: 'Payment link',
    });
  });

  it('keeps a notable status when there is no name', () => {
    expect(
      presentPaymentsTransactionRow({
        title: 'Lights',
        extraCount: 0,
        subtitle: '',
        methodLabel: 'Card',
        statusLabel: 'Refunded',
      }),
    ).toEqual({
      primary: 'Lights',
      extraLabel: '',
      subtitle: 'Refunded · Card',
    });
  });

  it('makes payouts title + status', () => {
    expect(
      presentPaymentsTransactionRow({
        kind: 'payout',
        source: 'payout',
        tone: 'payout',
        title: 'Payout',
        subtitle: '',
        statusLabel: 'Arrived',
        extraCount: 0,
      }),
    ).toEqual({
      primary: 'Payout',
      extraLabel: '',
      subtitle: 'Arrived',
    });
  });
});
