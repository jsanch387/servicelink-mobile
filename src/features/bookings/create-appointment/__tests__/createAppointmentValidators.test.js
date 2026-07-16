import {
  isAddressStepComplete,
  isCustomerStepComplete,
  isReviewStepComplete,
  isVehicleStepComplete,
  parseRequiredCustomJobPriceCents,
} from '../utils/createAppointmentValidators';

describe('createAppointmentValidators', () => {
  it('requires a custom-job price greater than zero', () => {
    expect(parseRequiredCustomJobPriceCents('')).toBeNull();
    expect(parseRequiredCustomJobPriceCents('.')).toBeNull();
    expect(parseRequiredCustomJobPriceCents('0')).toBeNull();
    expect(parseRequiredCustomJobPriceCents('0.00')).toBeNull();
    expect(parseRequiredCustomJobPriceCents('0.01')).toBe(1);
    expect(parseRequiredCustomJobPriceCents('$125.50')).toBe(12550);
  });

  it('isCustomerStepComplete requires name, full US phone; email optional but validated when present', () => {
    expect(
      isCustomerStepComplete({
        fullName: 'A',
        email: 'a@b.co',
        phone: '(555) 234-5678',
      }),
    ).toBe(true);
    expect(
      isCustomerStepComplete({
        fullName: 'A',
        email: '',
        phone: '(555) 234-5678',
      }),
    ).toBe(true);
    expect(isCustomerStepComplete({ fullName: '', email: 'a@b.co', phone: '(555) 234-5678' })).toBe(
      false,
    );
    expect(
      isCustomerStepComplete({ fullName: 'A', email: 'not-an-email', phone: '(555) 234-5678' }),
    ).toBe(false);
    expect(isCustomerStepComplete({ fullName: 'A', email: 'a@b.co', phone: '(555) 234' })).toBe(
      false,
    );
  });

  it('isAddressStepComplete requires street, city, state, zip', () => {
    expect(
      isAddressStepComplete({
        street: '1 Main',
        unit: '',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
      }),
    ).toBe(true);
    expect(isAddressStepComplete({ street: '1 Main', city: '', state: 'TX', zip: '78701' })).toBe(
      false,
    );
    expect(
      isAddressStepComplete({ street: '1 Main', city: 'Austin', state: 'TX', zip: '7870' }),
    ).toBe(false);
  });

  it('allows an empty vehicle or a complete valid vehicle, never a partial snapshot', () => {
    const now = new Date('2026-07-15T12:00:00Z');
    expect(isVehicleStepComplete({}, now)).toBe(true);
    expect(isVehicleStepComplete({ year: '2020', make: 'Toyota', model: 'Camry' }, now)).toBe(true);
    expect(isVehicleStepComplete({ year: '', make: 'Toyota', model: 'Camry' }, now)).toBe(false);
    expect(isVehicleStepComplete({ year: '1899', make: 'Toyota', model: 'Camry' }, now)).toBe(
      false,
    );
    expect(isVehicleStepComplete({ year: '2028', make: 'Toyota', model: 'Camry' }, now)).toBe(
      false,
    );
  });

  it('isReviewStepComplete aggregates gates', () => {
    const base = {
      selectedServiceId: 's1',
      selectedPricingId: 'p1',
      pricingOptions: [{ id: 'p1' }],
      selectedDateKey: '2026-04-29',
      selectedTime: '9:00 AM',
      customer: { fullName: 'A', email: '', phone: '(555) 234-5678' },
      appointmentLocationType: 'mobile',
      address: { street: '1', city: 'c', state: 'TX', zip: '78701' },
      vehicle: { year: '2020', make: 'x', model: 'y' },
    };
    expect(isReviewStepComplete(base)).toBe(true);
    expect(isReviewStepComplete({ ...base, vehicle: {} })).toBe(true);
    expect(
      isReviewStepComplete({
        ...base,
        appointmentLocationType: 'shop',
        addressSkipped: true,
        address: {},
      }),
    ).toBe(true);
    expect(isReviewStepComplete({ ...base, selectedTime: null })).toBe(false);
    expect(isReviewStepComplete({ ...base, selectedPricingId: 'wrong' })).toBe(false);
  });
});
