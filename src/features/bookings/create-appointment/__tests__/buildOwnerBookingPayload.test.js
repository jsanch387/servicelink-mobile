import {
  buildAddonDetailsPayload,
  buildOwnerBookingInsertPayload,
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

  describe('buildOwnerBookingInsertPayload', () => {
    const base = {
      catalog: { businessId: 'biz-1', businessSlug: 'acme' },
      selectedService: { name: 'Detail' },
      selectedServiceId: 'svc-1',
      selectedPricingOption: { label: 'Standard', priceCents: 12000 },
      selectedAddonRows: [],
      totalDurationMinutes: 90,
      selectedDateKey: '2026-05-01',
      selectedTime: '2:00 PM',
      customer: { fullName: 'Jane D', email: 'j@ex.co', phone: '(555) 123-4567' },
      address: { street: '1 Main', unit: '', city: 'Austin', state: 'TX', zip: '78701' },
      vehicle: { year: '2020', make: 'Honda', model: 'Civic' },
    };

    it('builds insert payload with trimmed fields and NANP phone digits', () => {
      const p = buildOwnerBookingInsertPayload(base);
      expect(p.businessId).toBe('biz-1');
      expect(p.businessSlug).toBe('acme');
      expect(p.serviceId).toBe('svc-1');
      expect(p.serviceName).toBe('Detail');
      expect(p.customerPhoneDigits).toBe('5551234567');
      expect(p.startTimeHhMmSs).toBe('14:00:00');
      expect(p.scheduledDate).toBe('2026-05-01');
      expect(p.durationMinutes).toBe(90);
      expect(p.addonDetails).toBeNull();
    });

    it('includes tier in service name when not Standard', () => {
      const p = buildOwnerBookingInsertPayload({
        ...base,
        selectedPricingOption: { label: 'Premium', priceCents: 15000 },
      });
      expect(p.serviceName).toBe('Detail — Premium');
    });
  });
});
