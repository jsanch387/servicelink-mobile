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
      kind: 'service',
    });
    expect(model?.isMultiJob).toBe(false);
    expect(model?.jobs).toBeNull();
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
        { id: 'service', label: 'Full Detail', amount: 120, kind: 'service' },
        { id: 'a1', label: 'Engine bay', amount: 25, kind: 'addon' },
      ],
      jobs: null,
      isMultiJob: false,
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
      { id: 'service', label: 'Full Detail', amount: 120, kind: 'service' },
      { id: 'a1', label: 'Engine bay', amount: 25, kind: 'addon' },
      { id: 'discount', label: 'SUMMER20', amount: -29, kind: 'discount' },
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

  it('builds multi-job line items and jobs from job_details (ignores first-job-only columns)', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Full Detail',
      service_price_cents: 22500,
      addon_details: {
        addons: [{ id: 'a1', name: 'Ceramic', price_cents: 5000 }],
      },
      job_details: [
        {
          id: 'j1',
          serviceName: 'Full Detail',
          servicePriceOptionLabel: 'Large SUV',
          servicePriceCents: 22500,
          selectedAddOns: [{ id: 'a1', name: 'Ceramic', priceCents: 5000 }],
          vehicle: { year: '2020', make: 'Tesla', model: 'Model 3' },
        },
        {
          id: 'j2',
          serviceName: 'Touch-up paint',
          servicePriceCents: 7500,
          vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
        },
      ],
      payment: {
        paidOnlineAmountCents: 0,
        remainingAmountCents: 35000,
        totalAmountCents: 35000,
      },
    });

    expect(model?.isMultiJob).toBe(true);
    expect(model?.jobs).toHaveLength(2);
    expect(model?.jobs?.[0]).toMatchObject({
      serviceName: 'Full Detail',
      pricingOption: 'Large SUV',
      servicePrice: 225,
      vehicleLine: '2020 Tesla Model 3',
    });
    expect(model?.jobs?.[1]).toMatchObject({
      serviceName: 'Touch-up paint',
      servicePrice: 75,
      vehicleLine: '2018 Honda Civic',
    });
    expect(model?.lineItems).toEqual([
      {
        id: 'job-j1-service',
        label: 'Full Detail',
        sublabel: 'Large SUV',
        amount: 225,
        jobId: 'j1',
        kind: 'service',
      },
      {
        id: 'job-j1-addon-a1',
        label: 'Ceramic',
        amount: 50,
        jobId: 'j1',
        kind: 'addon',
      },
      {
        id: 'job-j2-service',
        label: 'Touch-up paint',
        amount: 75,
        jobId: 'j2',
        kind: 'service',
      },
    ]);
    expect(model?.remainingAmountCents).toBe(35000);
  });

  it('heals addon lines from addon_details when job_details jobs have none', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Oil change',
      service_price_cents: 8500,
      addon_details: {
        addons: [{ id: 'a1', name: 'Wax', priceCents: 2500 }],
      },
      job_details: [
        {
          clientJobId: 'j1',
          serviceName: 'Oil change',
          servicePriceCents: 8500,
        },
      ],
      payment: { paidOnlineAmountCents: 0 },
    });

    expect(model?.lineItems).toEqual([
      {
        id: 'job-j1-service',
        label: 'Oil change',
        amount: 85,
        jobId: 'j1',
        kind: 'service',
      },
      { id: 'a1', label: 'Wax', amount: 25, jobId: 'j1', kind: 'addon' },
    ]);
  });

  it('returns null when booking is missing', () => {
    expect(buildCompleteVisitModelFromBooking(null)).toBeNull();
  });
});
