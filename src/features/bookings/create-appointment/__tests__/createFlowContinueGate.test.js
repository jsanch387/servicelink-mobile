import { canContinueCreateAppointmentStep } from '../utils/createFlowContinueGate';
import { CREATE_APPOINTMENT_STEP } from '../constants';

const reviewReady = {
  selectedServiceId: 's1',
  selectedPricingId: 'p1',
  pricingOptions: [{ id: 'p1' }],
  selectedDateKey: '2026-06-01',
  selectedTime: '9:00 AM',
  customer: { fullName: 'A B', email: 'a@b.co', phone: '(555) 234-5678' },
  appointmentLocationType: 'mobile',
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

  it('step 1 requires pricing selection unless step is skipped', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 1,
        selectedServiceId: 's',
        selectedPricingId: null,
        pricingSkipped: false,
        pricingOptions: [{ id: 'p1' }, { id: 'p2' }],
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
        step: 1,
        selectedServiceId: 's',
        selectedPricingId: 'stale-base-id',
        pricingSkipped: false,
        pricingOptions: [{ id: 'p1' }, { id: 'p2' }],
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
        step: 1,
        selectedServiceId: 's',
        selectedPricingId: 'p1',
        pricingSkipped: false,
        pricingOptions: [{ id: 'p1' }, { id: 'p2' }],
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
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 1,
        selectedServiceId: 's',
        selectedPricingId: null,
        pricingSkipped: true,
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

  it('allows a complete custom job and does not require catalog pricing', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: CREATE_APPOINTMENT_STEP.PRICING,
        selectedServiceId: '__custom_job__',
        selectedPricingId: null,
        isCustomJob: true,
        customJobComplete: true,
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

  it('keeps Continue disabled on the initial job chooser', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: CREATE_APPOINTMENT_STEP.SERVICE,
        selectedServiceId: 's1',
        selectedPricingId: null,
        servicePickPhase: 'chooser',
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

  it('step 1 blocks while tiered price options are loading', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: 1,
        selectedServiceId: 's',
        selectedPricingId: 'p1',
        pricingSkipped: false,
        pricingOptions: [{ id: 'p1' }],
        priceOptionsLoading: true,
        priceOptionsEnabled: true,
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

  it('allows an empty optional vehicle but blocks partial vehicle data', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: CREATE_APPOINTMENT_STEP.VEHICLE,
        selectedServiceId: 's',
        selectedPricingId: 'p',
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
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: CREATE_APPOINTMENT_STEP.VEHICLE,
        selectedServiceId: 's',
        selectedPricingId: 'p',
        acceptBookings: true,
        scheduleLoading: false,
        selectedDateKey: null,
        selectedTime: null,
        timeSlots: [],
        customer: {},
        address: {},
        vehicle: { year: '2022', make: '', model: '' },
      }),
    ).toBe(false);
  });

  it('step 8 uses isReviewStepComplete', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: CREATE_APPOINTMENT_STEP.REVIEW,
        ...reviewReady,
        acceptBookings: true,
        scheduleLoading: false,
        timeSlots: [],
      }),
    ).toBe(true);
  });

  it('allows review confirmation for a complete custom job', () => {
    expect(
      canContinueCreateAppointmentStep({
        appointmentConfirmed: false,
        step: CREATE_APPOINTMENT_STEP.REVIEW,
        ...reviewReady,
        selectedServiceId: '__custom_job__',
        selectedPricingId: null,
        isCustomJob: true,
        customJobComplete: true,
        acceptBookings: true,
        scheduleLoading: false,
        timeSlots: [],
      }),
    ).toBe(true);
  });
});
