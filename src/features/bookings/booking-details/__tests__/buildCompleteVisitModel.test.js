import { buildCompleteVisitModelFromBooking } from '../utils/buildCompleteVisitModel';

describe('buildCompleteVisitModelFromBooking', () => {
  it('splits service name and pricing option for the service line', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Full Detail — Premium',
      service_price_cents: 12000,
      addon_details: {
        addons: [{ id: 'a1', name: 'Engine bay', price_cents: 2500 }],
      },
      customer_email: 'jane@example.com',
      customer_phone: '5552345678',
      payment: { paidOnlineAmountCents: 5000 },
    });

    expect(model?.lineItems[0]).toEqual({
      id: 'service',
      label: 'Full Detail',
      sublabel: 'Premium',
      amount: 120,
    });
  });

  it('builds line items from service and addons with paid online', () => {
    const model = buildCompleteVisitModelFromBooking(
      {
        service_name: 'Full Detail',
        service_price_cents: 12000,
        addon_details: {
          addons: [{ id: 'a1', name: 'Engine bay', price_cents: 2500 }],
        },
        customer_email: 'jane@example.com',
        customer_phone: '5552345678',
        payment: { paidOnlineAmountCents: 5000 },
      },
      {
        showReviewSmsMessage: true,
        showReviewInviteMessage: false,
        showNoReviewInviteMessage: false,
      },
    );

    expect(model).toEqual({
      lineItems: [
        { id: 'service', label: 'Full Detail', amount: 120 },
        { id: 'a1', label: 'Engine bay', amount: 25 },
      ],
      paidOnline: 50,
      customerEmail: 'jane@example.com',
      showReviewSms: true,
      showReviewEmail: false,
      showInvoiceEmail: true,
    });
  });

  it('returns null when booking is missing', () => {
    expect(buildCompleteVisitModelFromBooking(null)).toBeNull();
  });
});
