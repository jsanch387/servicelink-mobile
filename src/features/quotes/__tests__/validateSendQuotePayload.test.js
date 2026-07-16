import {
  dbTimeToCreateQuoteTime12hSnapped,
  twelveHourDisplayToHhMm,
  validateSendQuotePayload,
} from '../utils/validateSendQuotePayload';

function validBase(overrides = {}) {
  return {
    businessSlug: 'cool-detailers',
    customerName: 'Jamie Lee',
    customerEmail: 'jamie@example.com',
    customerPhoneDisplay: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    serviceName: 'Interior detail',
    priceUsdText: '199',
    durationHhMm: '01:00',
    note: '',
    scheduledDateYyyyMmDd: '2026-08-20',
    scheduledStartTime12h: '10:00 AM',
    ...overrides,
  };
}

describe('validateSendQuotePayload', () => {
  it('returns ok with price in cents and omits note when empty', () => {
    const r = validateSendQuotePayload(validBase({ note: '   ' }));
    expect(r.ok).toBe(true);
    expect(r.body.priceCents).toBe(19900);
    expect(r.body.note).toBeUndefined();
  });

  it('includes note in body when business note is non-empty', () => {
    const r = validateSendQuotePayload(validBase({ note: 'Bring floor mats.' }));
    expect(r.ok).toBe(true);
    expect(r.body.note).toBe('Bring floor mats.');
  });

  it('rejects empty price string', () => {
    const r = validateSendQuotePayload(validBase({ priceUsdText: '' }));
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/valid price/i);
  });

  it('accepts zero price', () => {
    const r = validateSendQuotePayload(validBase({ priceUsdText: '0' }));
    expect(r.ok).toBe(true);
    expect(r.body.priceCents).toBe(0);
  });

  it('omits schedule when customer chooses the time', () => {
    const r = validateSendQuotePayload(
      validBase({
        scheduleMode: 'customer',
        scheduledDateYyyyMmDd: '',
        scheduledStartTime12h: '',
      }),
    );
    expect(r.ok).toBe(true);
    expect(r.body.scheduledDate).toBeUndefined();
    expect(r.body.scheduledStartTime).toBeUndefined();
  });

  it('includes schedule when owner picks date and time', () => {
    const r = validateSendQuotePayload(validBase({ scheduleMode: 'pick' }));
    expect(r.ok).toBe(true);
    expect(r.body.scheduledDate).toBe('2026-08-20');
    expect(r.body.scheduledStartTime).toBe('10:00');
  });

  it('includes catalog selection snapshots for the server', () => {
    const addonDetails = [
      {
        id: 'addon-1',
        name: 'Pet hair',
        priceCents: 2500,
        durationMinutes: 30,
      },
    ];
    const r = validateSendQuotePayload(
      validBase({
        serviceName: 'Interior detail — SUV',
        priceUsdText: '224',
        durationHhMm: '01:30',
        serviceId: 'service-1',
        servicePriceOptionId: 'option-1',
        servicePriceCents: 19900,
        totalDurationMinutes: 90,
        addonDetails,
      }),
    );

    expect(r.ok).toBe(true);
    expect(r.body).toEqual(
      expect.objectContaining({
        serviceId: 'service-1',
        servicePriceOptionId: 'option-1',
        servicePriceCents: 19900,
        addonDetails,
        priceCents: 22400,
        durationMinutes: 90,
      }),
    );
  });

  it('keeps custom jobs free of catalog-only fields', () => {
    const r = validateSendQuotePayload(
      validBase({
        serviceId: null,
        servicePriceOptionId: null,
        servicePriceCents: null,
        addonDetails: null,
      }),
    );

    expect(r.ok).toBe(true);
    expect(r.body.serviceId).toBeUndefined();
    expect(r.body.servicePriceOptionId).toBeUndefined();
    expect(r.body.servicePriceCents).toBeUndefined();
    expect(r.body.addonDetails).toBeUndefined();
  });

  it('normalizes phone to 10 digits when valid NANP', () => {
    const r = validateSendQuotePayload(validBase({ customerPhoneDisplay: '(512) 555-0199' }));
    expect(r.ok).toBe(true);
    expect(r.body.customerPhone).toBe('5125550199');
  });
});

describe('dbTimeToCreateQuoteTime12hSnapped', () => {
  it('snaps to half hours for TimeSelectField compatibility', () => {
    expect(dbTimeToCreateQuoteTime12hSnapped('09:14:00')).toMatch(/9:00 AM/i);
    expect(dbTimeToCreateQuoteTime12hSnapped('09:44:00')).toMatch(/9:30 AM/i);
    expect(dbTimeToCreateQuoteTime12hSnapped('09:46:00')).toMatch(/10:00 AM/i);
  });
});

describe('twelveHourDisplayToHhMm', () => {
  it('accepts half-hour grid used by schedule step', () => {
    expect(twelveHourDisplayToHhMm('9:00 AM')).toBe('09:00');
    expect(twelveHourDisplayToHhMm('9:30 AM')).toBe('09:30');
    expect(twelveHourDisplayToHhMm('9:15 AM')).toBeNull();
  });
});
