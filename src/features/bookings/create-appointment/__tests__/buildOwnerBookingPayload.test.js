import {
  buildAddonDetailsPayload,
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
        { id: 99, name: 'Seal', priceLabel: '$10', durationMinutes: 15 },
      ]);
      expect(out[0].id).toBe('99');
      expect(out[0].priceCents).toBe(1000);
    });
  });

  describe('buildOwnerManualPublicBookingBody', () => {
    const base = {
      catalog: { businessId: 'biz-1', businessSlug: 'acme' },
      selectedService: { name: 'Detail' },
      selectedServiceId: 'svc-1',
      selectedPricingOption: { label: 'Standard', priceCents: 12000 },
      selectedAddonRows: [],
      totalDurationMinutes: 90,
      selectedDateKey: '2026-05-01',
      selectedTime: '2:00 PM',
      customer: { fullName: 'Jane D', email: 'j@ex.co', phone: '(555) 234-5678' },
      address: { street: '1 Main', unit: '', city: 'Austin', state: 'tx', zip: '78701' },
      vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
      notes: '',
    };

    it('builds POST body for owner manual booking with API time and flags', () => {
      const b = buildOwnerManualPublicBookingBody(base);
      expect(b.businessId).toBe('biz-1');
      expect(b.businessSlug).toBe('acme');
      expect(b.serviceId).toBe('svc-1');
      expect(b.serviceName).toBe('Detail');
      expect(b.ownerManualBooking).toBe(true);
      expect(b.paymentMethodSelected).toBe('none');
      expect(b.serviceLocationType).toBe('mobile');
      expect(b.startTime).toBe('14:00');
      expect(b.scheduledDate).toBe('2026-05-01');
      expect(b.durationMinutes).toBe(90);
      expect(b.selectedAddOns).toEqual([]);
      expect(b.customer).toMatchObject({
        fullName: 'Jane D',
        email: 'j@ex.co',
        phone: '5552345678',
        streetAddress: '1 Main',
        state: 'TX',
        notes: '',
      });
    });

    it('trims customer notes', () => {
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
      expect(b.serviceLocationType).toBe('shop');
    });

    it('sends servicePriceOptionLabel instead of combined service name when tier is not Standard', () => {
      const b = buildOwnerManualPublicBookingBody({
        ...base,
        selectedPricingOption: { label: 'Premium', priceCents: 15000 },
      });
      expect(b.serviceName).toBe('Detail');
      expect(b.servicePriceOptionLabel).toBe('Premium');
      expect(b.servicePriceCents).toBe(15000);
    });
  });
});
