import { buildCompleteVisitModelFromBooking } from '../utils/buildCompleteVisitModel';

/**
 * Port of web `computeBookingAmountDue` for the cases these tests cover.
 * Session fees stay out of the taxable base. A rate above 0 replaces stored tax.
 *
 * @param {{
 *   lineSubtotalCents: number;
 *   discountCents?: number;
 *   taxRateBps?: number;
 *   storedTaxCents?: number;
 *   sessionFeeCents?: number;
 *   paidOnlineCents?: number;
 *   sessionDiscountCents?: number;
 *   sessionPaymentCents?: number;
 * }} input
 */
function serverAmountDueCents({
  lineSubtotalCents,
  discountCents = 0,
  taxRateBps = 0,
  storedTaxCents = 0,
  sessionFeeCents = 0,
  paidOnlineCents = 0,
  sessionDiscountCents = 0,
  sessionPaymentCents = 0,
}) {
  const line = Math.max(0, Math.round(lineSubtotalCents));
  const discount = Math.min(line, Math.max(0, Math.round(discountCents)));
  const base = Math.max(0, line - discount);
  const bps = Math.round(taxRateBps);
  const taxCents =
    bps > 0
      ? bps < 1 || bps > 2500 || base <= 0
        ? 0
        : Math.round((base * bps) / 10000)
      : Math.max(0, Math.round(storedTaxCents));
  const fees = Math.max(0, Math.round(sessionFeeCents));
  const adjustedTotalCents = Math.max(fees, line + fees - discount) + taxCents;
  const amountDueCents =
    adjustedTotalCents -
    Math.max(0, Math.round(paidOnlineCents)) -
    Math.max(0, Math.round(sessionDiscountCents)) -
    Math.max(0, Math.round(sessionPaymentCents));
  return { taxCents, adjustedTotalCents, amountDueCents };
}

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
      adjustments: [],
      jobs: null,
      isMultiJob: false,
      paidOnline: 50,
      remainingAmountCents: 9500,
      isPaidInFullOnline: false,
      customerEmail: 'jane@example.com',
      customerPhone: '5552345678',
      showReviewSms: true,
      showReviewEmail: false,
      showReviewInvite: true,
      showSmsOptOut: false,
      showInvoiceEmail: true,
      isMembershipVisit: false,
    });
  });

  it('adds the stored tax line and does not tax a membership visit', () => {
    const taxed = buildCompleteVisitModelFromBooking({
      service_name: 'Exterior Wash',
      service_price_cents: 8500,
      payment: { taxCents: 191, taxRateBps: 225, paidOnlineAmountCents: 0 },
    });
    expect(taxed?.lineItems.at(-1)).toEqual({
      id: 'tax',
      label: 'Tax (2.25%)',
      amount: 1.91,
      kind: 'tax',
    });

    const membership = buildCompleteVisitModelFromBooking({
      service_name: 'Exterior Wash',
      service_price_cents: 8500,
      payment: {
        taxCents: 191,
        taxRateBps: 225,
        paymentMethodSelected: 'membership',
      },
    });
    expect(membership?.lineItems.some((item) => item.kind === 'tax')).toBe(false);
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

  it('loads saved fees and discounts onto the payment sheet', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Exterior Wash',
      service_price_cents: 10000,
      session_fee_lines: [
        { id: 'fee-1', label: 'Travel', amount_cents: 2000, kind: 'fee' },
        { id: 'disc-1', label: 'Deposit', amount_cents: 5000, kind: 'discount' },
      ],
      payment: { paidOnlineAmountCents: 0 },
    });

    expect(model?.adjustments).toEqual([
      { id: 'fee-1', label: 'Travel', amount: 20, kind: 'fee' },
      { id: 'disc-1', label: 'Deposit', amount: -50, kind: 'discount' },
    ]);
  });

  it('adds stored tax to the receipt and the balance due', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Wash',
      service_price_cents: 8500,
      payment: {
        paidOnlineAmountCents: 0,
        taxCents: 191,
        taxRateBps: 225,
        totalAmountCents: 8691,
      },
    });

    expect(model?.lineItems).toEqual([
      { id: 'service', label: 'Wash', amount: 85, kind: 'service' },
      { id: 'tax', label: 'Tax (2.25%)', amount: 1.91, kind: 'tax' },
    ]);
    expect(model?.remainingAmountCents).toBe(8691);
  });

  it('keeps a membership visit untaxed', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Wash',
      service_price_cents: 0,
      payment: {
        paymentMethodSelected: 'membership',
        paidOnlineAmountCents: 0,
        taxCents: 191,
        taxRateBps: 225,
      },
    });

    expect(model?.lineItems.some((item) => item.kind === 'tax')).toBe(false);
    expect(model?.isMembershipVisit).toBe(true);
  });

  it('recomputes tax from the rate when the saved tax is still zero', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Wash',
      service_price_cents: 8500,
      payment: {
        paidOnlineAmountCents: 0,
        taxCents: 0,
        taxRateBps: 225,
        totalAmountCents: 8500,
        remainingAmountCents: 8500,
      },
    });

    expect(model?.lineItems.at(-1)).toEqual({
      id: 'tax',
      label: 'Tax (2.25%)',
      amount: 1.91,
      kind: 'tax',
    });
    expect(model?.remainingAmountCents).toBe(8691);
  });

  it('charges the server amount due when stored tax is from the pre-edit price', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Auto Detail',
      service_price_cents: 60000,
      job_details: [
        { id: 'j1', serviceName: 'Detail', servicePriceCents: 15000 },
        { id: 'j2', serviceName: 'Detail', servicePriceCents: 15000 },
        { id: 'j3', serviceName: 'Detail', servicePriceCents: 30000 },
      ],
      payment: {
        paidOnlineAmountCents: 0,
        taxCents: 2100,
        taxRateBps: 700,
        totalAmountCents: 60000,
        remainingAmountCents: 60000,
      },
    });

    expect(model?.lineItems.find((item) => item.kind === 'tax')).toEqual({
      id: 'tax',
      label: 'Tax (7%)',
      amount: 42,
      kind: 'tax',
    });
    const lineCents = (model?.lineItems ?? []).reduce(
      (sum, item) => sum + Math.round(item.amount * 100),
      0,
    );
    expect(lineCents).toBe(64200);
    expect(model?.remainingAmountCents).toBe(64200);
    expect(serverAmountDueCents({ lineSubtotalCents: 60000, taxRateBps: 700 })).toEqual({
      taxCents: 4200,
      adjustedTotalCents: 64200,
      amountDueCents: 64200,
    });
  });

  it('taxes the price after a frozen promo discount and after a deposit', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Detail',
      service_price_cents: 30000,
      discount_source: 'promo',
      discount_cents: 5000,
      discount_label: 'SAVE50',
      payment: {
        paidOnlineAmountCents: 10000,
        taxRateBps: 700,
        taxCents: 1750,
        totalAmountCents: 26750,
        remainingAmountCents: 16750,
      },
    });

    const due = serverAmountDueCents({
      lineSubtotalCents: 30000,
      discountCents: 5000,
      taxRateBps: 700,
      paidOnlineCents: 10000,
    });
    expect(due).toEqual({ taxCents: 1750, adjustedTotalCents: 26750, amountDueCents: 16750 });
    expect(model?.lineItems.find((item) => item.kind === 'tax')?.amount).toBe(17.5);
    expect(model?.remainingAmountCents).toBe(16750);
  });

  it('leaves a zero rate untaxed', () => {
    const model = buildCompleteVisitModelFromBooking({
      service_name: 'Wash',
      service_price_cents: 15000,
      payment: { taxCents: 0, taxRateBps: 0, paidOnlineAmountCents: 0, totalAmountCents: 15000 },
    });

    expect(model?.lineItems.some((item) => item.kind === 'tax')).toBe(false);
    expect(model?.remainingAmountCents).toBe(15000);
  });

  it('returns null when booking is missing', () => {
    expect(buildCompleteVisitModelFromBooking(null)).toBeNull();
  });
});
