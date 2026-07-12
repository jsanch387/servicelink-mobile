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
      remainingAmountCents: 9500,
      isPaidInFullOnline: false,
      customerEmail: 'jane@example.com',
      showReviewSms: true,
      showReviewEmail: false,
      showReviewInvite: true,
      showInvoiceEmail: true,
    });
  });

  it('includes discount line and reduces remaining amount due', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Full Detail',
      service_price_cents: 12000,
      addon_details: {
        addons: [{ id: 'a1', name: 'Engine bay', price_cents: 2500 }],
      },
      discount_source: 'promo',
      discount_cents: 2900,
      discount_label: 'SUMMER20',
      payment: { paidOnlineAmountCents: 5000 },
    });

    expect(model?.lineItems).toEqual([
      { id: 'service', label: 'Full Detail', amount: 120 },
      { id: 'a1', label: 'Engine bay', amount: 25 },
      { id: 'discount', label: 'SUMMER20', amount: -29 },
    ]);
    expect(model?.remainingAmountCents).toBe(6600);
    expect(model?.isPaidInFullOnline).toBe(false);
  });

  it('corrects remaining when payment total is still pre-discount', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Exterior Wash',
      service_price_cents: 8500,
      discount_source: 'sale',
      discount_cents: 2500,
      discount_label: 'Mobile Sale 2 — $25 off',
      payment: {
        paidOnlineAmountCents: 0,
        remainingAmountCents: 8500,
        totalAmountCents: 8500,
      },
    });

    expect(model?.remainingAmountCents).toBe(6000);
    expect(model?.lineItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'discount', amount: -25 })]),
    );
  });

  it('marks prepaid online bookings as paid in full when nothing remains due', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Full Detail',
      service_price_cents: 12000,
      addon_details: {
        addons: [{ id: 'a1', name: 'Engine bay', price_cents: 2500 }],
      },
      payment: {
        paidOnlineAmountCents: 14500,
        remainingAmountCents: 0,
        totalAmountCents: 14500,
      },
    });

    expect(model?.paidOnline).toBe(145);
    expect(model?.remainingAmountCents).toBe(0);
    expect(model?.isPaidInFullOnline).toBe(true);
  });

  it('returns null when booking is missing', () => {
    expect(buildCompleteVisitModelFromBooking(null)).toBeNull();
  });
});
