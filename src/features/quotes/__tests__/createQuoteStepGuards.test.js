import { CREATE_QUOTE_CUSTOM_JOB_ID, CREATE_QUOTE_STEP } from '../constants/createQuoteWizard';
import { canAdvanceCreateQuoteStep } from '../utils/createQuoteStepGuards';

const baseSnapshot = {
  customerName: 'Pat',
  customerEmail: 'pat@example.com',
  customerPhoneDisplay: '',
  selectedServiceId: CREATE_QUOTE_CUSTOM_JOB_ID,
  isCustomJob: true,
  selectedPricingId: null,
  pricingOptionsCount: 0,
  priceOptionsLoading: false,
  serviceName: 'Wash',
  priceUsdText: '50',
  durationHhMm: '01:00',
  scheduleMode: 'pick',
  scheduledDateYyyyMmDd: '2026-09-01',
  scheduledStartTime12h: '2:00 PM',
};

describe('canAdvanceCreateQuoteStep', () => {
  it('requires name, valid email, and optional valid phone on customer step', () => {
    expect(
      canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.CUSTOMER, {
        ...baseSnapshot,
        customerName: '',
      }),
    ).toBe(false);
    expect(canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.CUSTOMER, baseSnapshot)).toBe(true);
  });

  it('allows vehicle step without fields', () => {
    expect(canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.VEHICLE, baseSnapshot)).toBe(true);
  });

  it('requires a selected service on service pick step', () => {
    expect(
      canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.SERVICE, {
        ...baseSnapshot,
        selectedServiceId: null,
      }),
    ).toBe(false);
    expect(canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.SERVICE, baseSnapshot)).toBe(true);
  });

  it('blocks continue on the schedule path chooser', () => {
    expect(canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.SCHEDULE, baseSnapshot)).toBe(false);
  });

  it('requires valid date and time on the calendar pick step', () => {
    expect(
      canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.SCHEDULE_PICK, {
        ...baseSnapshot,
        scheduledDateYyyyMmDd: 'not-a-date',
      }),
    ).toBe(false);
    expect(
      canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.SCHEDULE_PICK, {
        ...baseSnapshot,
        scheduledStartTime12h: '9:15 AM',
      }),
    ).toBe(false);
    expect(canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.SCHEDULE_PICK, baseSnapshot)).toBe(true);
  });

  it('always allows review step', () => {
    expect(canAdvanceCreateQuoteStep(CREATE_QUOTE_STEP.REVIEW, baseSnapshot)).toBe(true);
  });
});
