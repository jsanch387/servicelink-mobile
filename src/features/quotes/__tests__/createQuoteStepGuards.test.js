import { canAdvanceCreateQuoteStep } from '../utils/createQuoteStepGuards';

const baseSnapshot = {
  customerName: 'Pat',
  customerEmail: 'pat@example.com',
  customerPhoneDisplay: '',
  serviceName: 'Wash',
  priceUsdText: '50',
  durationHhMm: '01:00',
  scheduledDateYyyyMmDd: '2026-09-01',
  scheduledStartTime12h: '2:00 PM',
};

describe('canAdvanceCreateQuoteStep', () => {
  it('requires name, valid email, and optional valid phone on customer step', () => {
    expect(canAdvanceCreateQuoteStep(0, { ...baseSnapshot, customerName: '' })).toBe(false);
    expect(canAdvanceCreateQuoteStep(0, { ...baseSnapshot, customerEmail: 'bad' })).toBe(false);
    expect(canAdvanceCreateQuoteStep(0, { ...baseSnapshot, customerPhoneDisplay: '123' })).toBe(
      false,
    );
    expect(canAdvanceCreateQuoteStep(0, baseSnapshot)).toBe(true);
  });

  it('allows vehicle step without fields', () => {
    expect(canAdvanceCreateQuoteStep(1, baseSnapshot)).toBe(true);
  });

  it('requires service, price, and duration on service step', () => {
    expect(canAdvanceCreateQuoteStep(2, { ...baseSnapshot, priceUsdText: '' })).toBe(false);
    expect(canAdvanceCreateQuoteStep(2, { ...baseSnapshot, serviceName: '' })).toBe(false);
    expect(canAdvanceCreateQuoteStep(2, { ...baseSnapshot, durationHhMm: '' })).toBe(false);
    expect(canAdvanceCreateQuoteStep(2, baseSnapshot)).toBe(true);
  });

  it('requires valid schedule date and time', () => {
    expect(
      canAdvanceCreateQuoteStep(3, { ...baseSnapshot, scheduledDateYyyyMmDd: 'not-a-date' }),
    ).toBe(false);
    expect(
      canAdvanceCreateQuoteStep(3, { ...baseSnapshot, scheduledStartTime12h: '9:15 AM' }),
    ).toBe(false);
    expect(canAdvanceCreateQuoteStep(3, baseSnapshot)).toBe(true);
  });

  it('always allows review step', () => {
    expect(canAdvanceCreateQuoteStep(4, baseSnapshot)).toBe(true);
  });
});
