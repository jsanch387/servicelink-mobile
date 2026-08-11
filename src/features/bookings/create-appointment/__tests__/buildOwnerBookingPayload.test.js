import {
  buildAddonDetailsPayload,
  buildJobVehicleForPublicApi,
  buildOwnerManualJobItem,
  buildOwnerManualPublicBookingBody,
  buildSelectedAddOnsForPublicApi,
  buildServiceDisplayName,
} from '../utils/buildOwnerBookingPayload';

describe('buildOwnerBookingPayload', () => {
  describe('buildServiceDisplayName', () => {
    it('returns base name only for Standard tier', () => {
      expect(
        buildServiceDisplayName({ name: 'Oil change' }, { label: 'Standard', priceCents: 5000 }),
      ).toBe('Oil change');
    });

    it('combines base and tier when tier is not Standard', () => {
      expect(
        buildServiceDisplayName({ name: 'Oil change' }, { label: 'Synthetic', priceCents: 8000 }),
      ).toBe('Oil change — Synthetic');
    });

    it('uses fallback when service name missing', () => {
      expect(buildServiceDisplayName(null, { label: 'Deluxe' })).toBe('Service — Deluxe');
    });
  });

  describe('buildAddonDetailsPayload', () => {
    it('returns null for empty selection', () => {
      expect(buildAddonDetailsPayload([])).toBeNull();
      expect(buildAddonDetailsPayload(null)).toBeNull();
    });

    it('maps add-ons with price from label', () => {
      const out = buildAddonDetailsPayload([
        { id: 'a1', name: 'Wax', priceLabel: '$35', durationMinutes: 30 },
      ]);
      expect(out.addons).toHaveLength(1);
      expect(out.addons[0]).toMatchObject({
        id: 'a1',
        name: 'Wax',
        priceCents: 3500,
        durationMinutes: 30,
      });
    });
  });

  describe('buildSelectedAddOnsForPublicApi', () => {
    it('returns empty array when none selected', () => {
      expect(buildSelectedAddOnsForPublicApi([])).toEqual([]);
    });

    it('stringifies ids for JSON', () => {
      const out = buildSelectedAddOnsForPublicApi([
        { id: 99, name: 'Seal', priceCents: 1250, priceLabel: '$10', durationMinutes: 15 },
      ]);
      expect(out[0].id).toBe('99');
      expect(out[0].priceCents).toBe(1250);
    });
  });

  describe('buildOwnerManualJobItem', () => {
    it('maps a catalog job with tier and add-ons', () => {
      const item = buildOwnerManualJobItem({
        localId: 'job-1',
        selectedServiceId: 'svc-1',
        isCustomJob: false,
        serviceName: 'Full detail',
        selectedPricingOption: { id: 'opt-suv', label: 'SUV', priceCents: 22500 },
        selectedAddonRows: [{ id: 'a1', name: 'Pet hair', priceCents: 2500, durationMinutes: 15 }],
        totalDurationMinutes: 135,
        vehicle: { year: '2022', make: 'Toyota', model: 'Highlander' },
      });
      expect(item).toEqual({
        serviceId: 'svc-1',
        serviceName: 'Full detail',
        servicePriceOptionLabel: 'SUV',
        servicePriceCents: 22500,
        selectedAddOns: [{ id: 'a1', name: 'Pet hair', priceCents: 2500, durationMinutes: 15 }],
        durationMinutes: 135,
        vehicle: { year: '2022', make: 'Toyota', model: 'Highlander' },
        clientJobId: 'job-1',
      });
    });

    it('omits serviceId, option label, and add-ons for custom jobs', () => {
      const item = buildOwnerManualJobItem({
        localId: 'job-custom',
        selectedServiceId: null,
        isCustomJob: true,
        serviceName: 'Touch-up paint',
        selectedPricingOption: { label: 'Standard', priceCents: 7500 },
        selectedAddonRows: [{ id: 'a1', name: 'Nope', priceCents: 100 }],
        totalDurationMinutes: 45,
        vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
      });
      expect(item.serviceId).toBeUndefined();
      expect(item.servicePriceOptionLabel).toBeUndefined();
      expect(item.selectedAddOns).toBeUndefined();
      expect(item.serviceName).toBe('Touch-up paint');
      expect(item.servicePriceCents).toBe(7500);
      expect(item.clientJobId).toBe('job-custom');
    });
  });

  describe('buildOwnerManualPublicBookingBody', () => {
    const catalogJob = {
      localId: 'job-1',
      selectedServiceId: 'svc-1',
      isCustomJob: false,
      serviceName: 'Detail',
      selectedPricingOption: { label: 'Standard', priceCents: 12000 },
      selectedAddonRows: [],
      totalDurationMinutes: 90,
      vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
    };

    const base = {
      catalog: { businessId: 'biz-1', businessSlug: 'acme' },
      selectedDateKey: '2026-05-01',
      selectedTime: '2:00 PM',
      customer: { fullName: 'Jane D', email: 'j@ex.co', phone: '(555) 234-5678' },
      address: { street: '1 Main', unit: '', city: 'Austin', state: 'tx', zip: '78701' },
      notes: '',
      jobs: [catalogJob],
    };

    it('builds appointment + jobs[] without top-level service fields', () => {
      const b = buildOwnerManualPublicBookingBody(base);
      expect(b.businessId).toBe('biz-1');
      expect(b.businessSlug).toBe('acme');
      expect(b.ownerManualBooking).toBe(true);
      expect(b.paymentMethodSelected).toBe('none');
      expect(b.serviceLocationType).toBe('mobile');
      expect(b.startTime).toBe('14:00');
      expect(b.scheduledDate).toBe('2026-05-01');
      expect(b.serviceName).toBeUndefined();
      expect(b.serviceId).toBeUndefined();
      expect(b.servicePriceCents).toBeUndefined();
      expect(b.durationMinutes).toBeUndefined();
      expect(b.selectedAddOns).toBeUndefined();
      expect(b.jobs).toHaveLength(1);
      expect(b.jobs[0]).toMatchObject({
        serviceId: 'svc-1',
        serviceName: 'Detail',
        servicePriceCents: 12000,
        durationMinutes: 90,
        vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
      });
      expect(b.customer).toMatchObject({
        fullName: 'Jane D',
        email: 'j@ex.co',
        phone: '5552345678',
        streetAddress: '1 Main',
        state: 'TX',
        notes: '',
      });
      expect(b.customer.vehicleYear).toBeUndefined();
      expect(b.customer.vehicleMake).toBeUndefined();
      expect(b.customer.vehicleModel).toBeUndefined();
    });

    it('supports multiple catalog + custom jobs in one body', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        jobs: [
          catalogJob,
          {
            localId: 'job-2',
            selectedServiceId: null,
            isCustomJob: true,
            serviceName: 'Touch-up paint',
            selectedPricingOption: { priceCents: 7500 },
            selectedAddonRows: [],
            totalDurationMinutes: 45,
            vehicle: { year: '2018', make: 'Honda', model: 'Civic' },
          },
        ],
      });
      expect(b.jobs).toHaveLength(2);
      expect(b.jobs[0].serviceId).toBe('svc-1');
      expect(b.jobs[1].serviceId).toBeUndefined();
      expect(b.jobs[1].serviceName).toBe('Touch-up paint');
    });

    it('trims customer notes and does not invent job prefixes', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        notes: '  Pull into bay 2  ',
      });
      expect(b.customer.notes).toBe('Pull into bay 2');
    });

    it('uses empty string customer email when omitted', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        customer: { fullName: 'Jane D', email: '  ', phone: '(555) 234-5678' },
      });
      expect(b.customer.email).toBe('');
    });

    it('sends shop serviceLocationType when selected', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        appointmentLocationType: 'shop',
      });
      expect(b.serviceLocationType).toBe('shop');
    });

    it('does not send web alias customerServiceLocation', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        appointmentLocationType: 'shop',
      });
      expect(b.customerServiceLocation).toBeUndefined();
      expect(b.bookingSource).toBeUndefined();
      expect(b.booking_source).toBeUndefined();
      expect(b.serviceLocationType).toBe('shop');
    });

    it('puts servicePriceOptionLabel on the job when tier is not base', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        jobs: [
          {
            ...catalogJob,
            selectedPricingOption: { label: 'Premium', priceCents: 15000 },
          },
        ],
      });
      expect(b.jobs[0].serviceName).toBe('Detail');
      expect(b.jobs[0].servicePriceOptionLabel).toBe('Premium');
      expect(b.jobs[0].servicePriceCents).toBe(15000);
    });

    it('keeps a real pricing option labeled Standard on the job', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        jobs: [
          {
            ...catalogJob,
            selectedPricingOption: { id: 'option-1', label: 'Standard', priceCents: 12000 },
          },
        ],
      });
      expect(b.jobs[0].servicePriceOptionLabel).toBe('Standard');
    });

    it('includes appointment-level sale fields when owner opts in', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        availableSaleDiscount: {
          sale: { id: 'sale-1' },
          subtotalCents: 12000,
          discountCents: 2400,
          discountLabel: '20% OFF',
          discountType: 'percentage',
          discountValue: 20,
        },
        applySaleDiscount: true,
      });
      expect(b.applySaleDiscount).toBe(true);
      expect(b.discountSource).toBe('sale');
      expect(b.discountSaleId).toBe('sale-1');
      expect(b.discountType).toBe('percentage');
      expect(b.discountValue).toBe(20);
      expect(b.subtotalCents).toBe(12000);
      expect(b.discountCents).toBe(2400);
      expect(b.discountLabel).toBe('20% OFF');
      expect(b.jobs[0].servicePriceCents).toBe(12000);
    });

    it('sends applySaleDiscount false and omits snapshot when owner opts out', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        availableSaleDiscount: {
          sale: { id: 'sale-1' },
          subtotalCents: 12000,
          discountCents: 2400,
          discountLabel: '20% OFF',
          discountType: 'percentage',
          discountValue: 20,
        },
        applySaleDiscount: false,
      });
      expect(b.applySaleDiscount).toBe(false);
      expect(b.discountSource).toBeUndefined();
      expect(b.discountSaleId).toBeUndefined();
      expect(b.discountCents).toBeUndefined();
    });

    it('omits discount fields when no sale is available', () => {
      const b = buildOwnerManualPublicBookingBody(base);
      expect(b.applySaleDiscount).toBeUndefined();
      expect(b.discountSource).toBeUndefined();
      expect(b.discountSaleId).toBeUndefined();
      expect(b.discountCents).toBeUndefined();
    });

    it('builds empty vehicle strings via helper', () => {
      expect(buildJobVehicleForPublicApi(null)).toEqual({ year: '', make: '', model: '' });
    });

    it('keeps digits in make/model (Ram 2500, F-150, 911)', () => {
      expect(buildJobVehicleForPublicApi({ year: '2015', make: 'Ram', model: '2500' })).toEqual({
        year: '2015',
        make: 'Ram',
        model: '2500',
      });
      expect(
        buildJobVehicleForPublicApi({ year: '2022', make: 'F-150', model: 'Super Duty' }),
      ).toEqual({ year: '2022', make: 'F-150', model: 'Super Duty' });
    });
  });
});
