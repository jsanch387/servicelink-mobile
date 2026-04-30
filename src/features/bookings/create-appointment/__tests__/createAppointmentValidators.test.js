import {
  isAddressStepComplete,
  isCustomerStepComplete,
  isReviewStepComplete,
  isVehicleStepComplete,
} from '../utils/createAppointmentValidators';

describe('createAppointmentValidators', () => {
  it('isCustomerStepComplete requires name, valid email, full US phone', () => {
    expect(
      isCustomerStepComplete({
        fullName: 'A',
        email: 'a@b.co',
        phone: '(555) 123-4567',
      }),
    ).toBe(true);
    expect(isCustomerStepComplete({ fullName: '', email: 'a@b.co', phone: '(555) 123-4567' })).toBe(
      false,
    );
    expect(
      isCustomerStepComplete({ fullName: 'A', email: 'not-an-email', phone: '(555) 123-4567' }),
    ).toBe(false);
    expect(isCustomerStepComplete({ fullName: 'A', email: 'a@b.co', phone: '(555) 123' })).toBe(
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
  });

  it('isVehicleStepComplete requires year, make, model', () => {
    expect(isVehicleStepComplete({ year: '2020', make: 'Toyota', model: 'Camry' })).toBe(true);
    expect(isVehicleStepComplete({ year: '', make: 'Toyota', model: 'Camry' })).toBe(false);
  });

  it('isReviewStepComplete aggregates gates', () => {
    const base = {
      selectedServiceId: 's1',
      selectedPricingId: 'p1',
      selectedDateKey: '2026-04-29',
      selectedTime: '9:00 AM',
      customer: { fullName: 'A', email: 'a@b.co', phone: '(555) 123-4567' },
      address: { street: '1', city: 'c', state: 'TX', zip: '1' },
      vehicle: { year: '2020', make: 'x', model: 'y' },
    };
    expect(isReviewStepComplete(base)).toBe(true);
    expect(isReviewStepComplete({ ...base, selectedTime: null })).toBe(false);
  });
});
