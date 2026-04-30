import { canContinueCreateAppointmentStep } from '../utils/createFlowContinueGate';

const reviewReady = {
  selectedServiceId: 's1',
  selectedPricingId: 'p1',
  selectedDateKey: '2026-06-01',
  selectedTime: '9:00 AM',
  customer: { fullName: 'A B', email: 'a@b.co', phone: '(555) 111-2222' },
  address: { street: '1 St', city: 'X', state: 'TX', zip: '11111' },
  vehicle: { year: '2020', make: 'Y', model: 'Z' },
};

describe('canContinueCreateAppointmentStep', () => {
  it('returns false when appointment already confirmed', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: true,
        step: 0,
        selectedServiceId: 's',
        selectedPricingId: null,
        acceptBookings: true,
        scheduleLoading: false,
        selectedDateKey: null,
        selectedTime: null,
        timeSlots: [],
        customer: {},
        address: {},
        vehicle: {},
      }),
    ).toBe(false);
  });

  it('step 0 requires service', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 0,
        selectedServiceId: null,
        selectedPricingId: null,
        acceptBookings: true,
        scheduleLoading: false,
        selectedDateKey: null,
        selectedTime: null,
        timeSlots: [],
        customer: {},
        address: {},
        vehicle: {},
      }),
    ).toBe(false);
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 0,
        selectedServiceId: 'x',
        selectedPricingId: null,
        acceptBookings: true,
        scheduleLoading: false,
        selectedDateKey: null,
        selectedTime: null,
        timeSlots: [],
        customer: {},
        address: {},
        vehicle: {},
      }),
    ).toBe(true);
  });

  it('step 3 requires slot in timeSlots', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 3,
        selectedServiceId: 's',
        selectedPricingId: 'p',
        acceptBookings: true,
        scheduleLoading: false,
        selectedDateKey: '2026-01-01',
        selectedTime: '10:00 AM',
        timeSlots: ['9:00 AM'],
        customer: {},
        address: {},
        vehicle: {},
      }),
    ).toBe(false);
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 3,
        selectedServiceId: 's',
        selectedPricingId: 'p',
        acceptBookings: true,
        scheduleLoading: false,
        selectedDateKey: '2026-01-01',
        selectedTime: '10:00 AM',
        timeSlots: ['10:00 AM'],
        customer: {},
        address: {},
        vehicle: {},
      }),
    ).toBe(true);
  });

  it('step 7 uses isReviewStepComplete', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 7,
        ...reviewReady,
        acceptBookings: true,
        scheduleLoading: false,
        timeSlots: [],
      }),
    ).toBe(true);
  });
});
