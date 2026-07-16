import { QUOTE_DETAIL_KIND_REQUEST, QUOTE_DETAIL_KIND_SENT } from '../constants';
import {
  deriveQuoteDetailKind,
  formatOwnerFacingQuoteStatus,
  mapQuoteDetailModel,
  mapQuoteRequestCard,
  mapSentQuoteCard,
  partitionQuotesForInbox,
} from '../utils/quotePresentation';

describe('partitionQuotesForInbox', () => {
  it('puts customer_requested + requested rows in requests, everything else in sent', () => {
    const inbound = {
      id: '1',
      source: 'customer_requested',
      status: 'requested',
    };
    const outbound = {
      id: '2',
      source: 'owner',
      status: 'sent',
    };
    const { requests, sent } = partitionQuotesForInbox([inbound, outbound]);
    expect(requests).toEqual([inbound]);
    expect(sent).toEqual([outbound]);
  });
});

describe('mapSentQuoteCard', () => {
  it('includes statusRaw and owner-facing status label', () => {
    const row = {
      id: 'q1',
      customer_name: 'Alex',
      service_name: 'Wash — SUV',
      price_cents: 5000,
      status: 'approved',
      updated_at: '2026-07-14T15:00:00Z',
    };
    const card = mapSentQuoteCard(row);
    expect(card.statusRaw).toBe('approved');
    expect(card.statusLabel).toBe(formatOwnerFacingQuoteStatus('approved'));
    expect(card.customerName).toBe('Alex');
    expect(card.line).toContain('Wash');
    expect(card.title).toBe('Wash');
    expect(card.priceLabel).toBeUndefined();
    expect(card.timestampLabel).toBe('');
  });

  it('maps sent status to Pending label for inbox', () => {
    const card = mapSentQuoteCard({
      id: 'q2',
      customer_name: 'Bo',
      service_name: '',
      price_cents: null,
      status: 'sent',
    });
    expect(card.statusRaw).toBe('sent');
    expect(card.statusLabel).toBe('Pending');
  });
});

describe('mapQuoteRequestCard', () => {
  it('surfaces the service, message, vehicle, and received time', () => {
    const card = mapQuoteRequestCard(
      {
        id: 'r1',
        customer_name: 'Casey',
        service_name: 'Full detail',
        request_message: 'Please remove a coffee stain.',
        vehicle_year: 2022,
        vehicle_make: 'Honda',
        vehicle_model: 'Civic',
        created_at: '2026-07-14T15:00:00Z',
      },
      new Date('2026-07-14T18:00:00Z').getTime(),
    );

    expect(card.title).toBe('Full detail');
    expect(card.summary).toBe('Please remove a coffee stain.');
    expect(card.vehicleLabel).toBe('2022 Honda Civic');
    expect(card.statusLabel).toBe('New request');
    expect(card.timestampLabel).toMatch(/^Received Today/);
  });
});

describe('deriveQuoteDetailKind', () => {
  it('returns request for inbound requested rows', () => {
    expect(
      deriveQuoteDetailKind({
        source: 'customer_requested',
        status: 'requested',
      }),
    ).toBe(QUOTE_DETAIL_KIND_REQUEST);
  });

  it('returns sent for outbound rows', () => {
    expect(
      deriveQuoteDetailKind({
        source: 'owner',
        status: 'sent',
      }),
    ).toBe(QUOTE_DETAIL_KIND_SENT);
  });
});

describe('mapQuoteDetailModel', () => {
  it('includes request scheduling and vehicle parts for quote requests', () => {
    const row = {
      id: 'r1',
      business_id: 'b1',
      status: 'requested',
      source: 'customer_requested',
      customer_name: 'Casey',
      customer_email: 'c@ex.com',
      customer_phone: '5125550100',
      vehicle_year: 2022,
      vehicle_make: 'Honda',
      vehicle_model: 'Civic',
      request_message: 'Please quote',
      service_name: 'Full detail',
      scheduled_date: '2026-06-10',
      scheduled_start_time: '14:30:00',
      serviceAddressLine: '500 Congress Ave, Austin, TX',
      created_at: '2026-01-01T12:00:00Z',
      updated_at: '2026-01-01T12:00:00Z',
    };
    const model = mapQuoteDetailModel(row, QUOTE_DETAIL_KIND_REQUEST, {});
    expect(model.customerName).toBe('Casey');
    expect(model.message).toBe('Please quote');
    expect(model.vehicleMake).toBe('Honda');
    expect(model.scheduledDateYyyyMmDd).toBe('2026-06-10');
    expect(model.scheduledStartTime12h).toMatch(/2:30 PM/i);
    expect(model.requestedDateLabel).toMatch(/June 10/i);
    expect(model.requestedTimeLabel).toMatch(/2:30 PM/i);
    expect(model.serviceAddressLine).toBe('500 Congress Ave, Austin, TX');
  });

  it('includes statusRaw on sent quote model', () => {
    const row = {
      id: 's1',
      business_id: 'b1',
      status: 'viewed',
      source: 'owner',
      customer_name: 'Dee',
      customer_email: 'd@ex.com',
      customer_phone: '',
      service_name: 'Wax',
      price_cents: 12000,
      duration_minutes: 60,
      updated_at: '2026-01-02T15:00:00Z',
      created_at: '2026-01-02T15:00:00Z',
    };
    const model = mapQuoteDetailModel(row, QUOTE_DETAIL_KIND_SENT, { activeLinkExpiresAt: null });
    expect(model.statusRaw).toBe('viewed');
    expect(model.statusLabel).toBe('Viewed');
  });

  it('maps normalized catalog detail, add-ons, and approved schedule', () => {
    const model = mapQuoteDetailModel(
      {
        id: 's2',
        status: 'approved',
        source: 'owner_created',
        customerName: 'Jamie',
        customerEmail: 'jamie@example.com',
        customerPhone: null,
        serviceName: 'Full detail — Large SUV',
        totalCents: 25000,
        durationMinutes: 210,
        serviceId: 'service-1',
        servicePriceOptionId: 'option-1',
        servicePriceCents: 20000,
        addonDetails: [
          {
            id: 'addon-1',
            name: 'Engine bay',
            priceCents: 5000,
            durationMinutes: 30,
          },
        ],
        scheduledDate: '2026-07-20',
        scheduledTime: '09:30:00',
        note: 'Includes clay bar',
        vehicleLine: '2024 Ford Explorer',
        serviceAddressLine: '123 Main St, Austin, TX 78701',
        createdAt: '2026-07-14T12:00:00Z',
        activityAt: '2026-07-14T15:00:00Z',
      },
      QUOTE_DETAIL_KIND_SENT,
    );

    expect(model.serviceTitle).toBe('Full detail');
    expect(model.pricingOptionLabel).toBe('Large SUV');
    expect(model.servicePriceFormatted).toBe('$200');
    expect(model.addonDetails).toEqual([
      expect.objectContaining({ name: 'Engine bay', priceFormatted: '$50' }),
    ]);
    expect(model.priceFormatted).toBe('$250');
    expect(model.scheduleState).toBe('scheduled');
    expect(model.scheduleLabel).toMatch(/July 20, 2026.*9:30 AM/i);
    expect(model.scheduleDateLabel).toMatch(/July 20, 2026/i);
    expect(model.scheduleTimeLabel).toMatch(/9:30 AM/i);
    expect(model.serviceAddressLine).toContain('123 Main St');
    expect(model.note).toBe('Includes clay bar');
  });
});
