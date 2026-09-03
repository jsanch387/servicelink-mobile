import {
  QUOTE_DETAIL_KIND_REQUEST,
  QUOTE_DETAIL_KIND_SENT,
  QUOTES_FILTER_APPROVED,
  QUOTES_FILTER_REQUEST,
  QUOTES_FILTER_SENT,
} from '../constants';
import {
  deriveQuoteDetailKind,
  formatOwnerFacingQuoteStatus,
  formatQuoteDetailTimestamp,
  groupQuotesByWorkflow,
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

describe('groupQuotesByWorkflow', () => {
  it('groups quote lifecycle states into Request, Sent, and Approved', () => {
    const rows = [
      { id: 'request', status: 'requested' },
      { id: 'draft', status: 'draft' },
      { id: 'sent', status: 'sent' },
      { id: 'viewed', status: 'viewed' },
      { id: 'approved', status: 'approved' },
      { id: 'declined', status: 'declined' },
      { id: 'expired', status: 'expired' },
      { id: 'cancelled', status: 'cancelled' },
    ];

    const groups = groupQuotesByWorkflow(rows);

    expect(groups[QUOTES_FILTER_REQUEST].map((row) => row.id)).toEqual(['request', 'draft']);
    expect(groups[QUOTES_FILTER_SENT].map((row) => row.id)).toEqual(['sent', 'viewed']);
    expect(groups[QUOTES_FILTER_APPROVED].map((row) => row.id)).toEqual(['approved']);
    const visibleIds = Object.values(groups)
      .flat()
      .map((row) => row.id);
    expect(visibleIds).not.toContain('declined');
    expect(visibleIds).not.toContain('expired');
    expect(visibleIds).not.toContain('cancelled');
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
      vehicle_year: 2022,
      vehicle_make: 'Tesla',
      vehicle_model: 'Model Y',
      scheduled_date: '2026-07-15',
      updated_at: '2026-07-14T15:00:00Z',
    };
    const card = mapSentQuoteCard(row, new Date('2026-07-14T18:00:00Z').getTime());
    expect(card.statusRaw).toBe('approved');
    expect(card.statusLabel).toBe(formatOwnerFacingQuoteStatus('approved'));
    expect(card.customerName).toBe('Alex');
    expect(card.line).toContain('Wash');
    expect(card.title).toBe('Wash');
    expect(card.priceLabel).toBe('$50');
    expect(card.serviceLabel).toBe('Wash');
    expect(card.vehicleLabel).toBe('2022 Tesla Model Y');
    expect(card.vehicleExtraLabel).toBe('');
    expect(card.timingLabel).toBe('Tomorrow');
    expect(card.timingLead).toBeUndefined();
    expect(card.dateLabel).toBeUndefined();
    expect(card.timestampLabel).toBe('');
  });

  it('labels a sent quote as Quote sent on the card', () => {
    const card = mapSentQuoteCard({
      id: 'q2',
      customer_name: 'Bo',
      service_name: '',
      price_cents: null,
      status: 'sent',
    });
    expect(card.statusRaw).toBe('sent');
    expect(card.statusLabel).toBe('Quote sent');
  });

  it('caps several vehicles with a count so the line stays one row', () => {
    const card = mapSentQuoteCard({
      id: 'q3',
      customer_name: 'Sarah',
      status: 'sent',
      assets: [
        {
          type: 'vehicle',
          label: '2022 Tesla Model Y',
          attributes: { year: '2022', make: 'Tesla', model: 'Model Y' },
        },
        {
          type: 'vehicle',
          label: '2018 Toyota Tacoma',
          attributes: { year: '2018', make: 'Toyota', model: 'Tacoma' },
        },
        {
          type: 'vehicle',
          label: '2015 Honda Civic',
          attributes: { year: '2015', make: 'Honda', model: 'Civic' },
        },
      ],
    });
    expect(card.vehicleLabel).toBe('2022 Tesla Model Y');
    expect(card.vehicleExtraLabel).toBe('+2 more');
  });

  it('shows the booked date and time on approved quotes', () => {
    const card = mapSentQuoteCard(
      {
        id: 'q4',
        status: 'approved',
        scheduled_date: '2026-07-04',
        scheduled_start_time: '09:30:00',
      },
      new Date('2026-06-09T18:00:00Z').getTime(),
    );
    expect(card.timingLabel).toBe('Sat, Jul 4 - 9:30 AM');
  });

  it('drops empty minutes from the time', () => {
    const card = mapSentQuoteCard(
      { id: 'q7', status: 'approved', scheduled_date: '2026-06-13', scheduled_start_time: '09:00' },
      new Date('2026-06-09T18:00:00Z').getTime(),
    );
    expect(card.timingLabel).toBe('Sat, Jun 13 - 9 AM');
  });

  it('flags an approved quote that still has no date', () => {
    const card = mapSentQuoteCard({ id: 'q5', status: 'approved' });
    expect(card.timingLabel).toBe('Not set yet');
  });

  it('leaves the timing blank on an unscheduled quote still awaiting a reply', () => {
    expect(mapSentQuoteCard({ id: 'q6', status: 'sent' }).timingLabel).toBe('');
  });
});

describe('mapQuoteRequestCard', () => {
  it('surfaces the ask and preferred timing instead of a received date', () => {
    const card = mapQuoteRequestCard(
      {
        id: 'r1',
        customer_name: 'Casey',
        service_name: 'need my seats cleaned shampooed and extracted',
        request_message:
          'Preferred timing: This week\nneed my seats cleaned shampooed and extracted',
        vehicle_year: 2018,
        vehicle_make: 'Toyota',
        vehicle_model: 'Tacoma',
        created_at: '2026-07-14T15:00:00Z',
      },
      new Date('2026-07-14T18:00:00Z').getTime(),
    );

    expect(card.title).toBe('');
    expect(card.summary).toBe('');
    expect(card.vehicleLabel).toBe('2018 Toyota Tacoma');
    expect(card.timingLabel).toBe('This week');
    expect(card.dateLabel).toBeUndefined();
    expect(card.timestampLabel).toBe('');
    expect(card.statusLabel).toBe('New request');
  });

  it('uses a short day label when the customer picked a date', () => {
    const card = mapQuoteRequestCard(
      {
        id: 'r2',
        customer_name: 'Casey',
        service_name: 'Full detail',
        request_message: 'Please remove a coffee stain.',
        scheduled_date: '2026-06-10',
        scheduled_start_time: '14:30:00',
      },
      new Date('2026-06-09T18:00:00Z').getTime(),
    );

    expect(card.title).toBe('Full detail');
    expect(card.summary).toBe('');
    expect(card.timingLabel).toBe('Tomorrow - 2:30 PM');
  });

  it('pairs the weekday with its date once past tomorrow', () => {
    const nowMs = new Date('2026-06-09T18:00:00Z').getTime();
    expect(mapQuoteRequestCard({ id: 'r3', scheduled_date: '2026-06-13' }, nowMs).timingLabel).toBe(
      'Sat, Jun 13',
    );
    expect(mapQuoteRequestCard({ id: 'r4', scheduled_date: '2026-07-04' }, nowMs).timingLabel).toBe(
      'Sat, Jul 4',
    );
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
        requestMessage: 'Customer needs pet hair removed',
        note: 'Includes clay bar',
        vehicleLine: '2024 Ford Explorer',
        serviceAddressLine: '123 Main St, Austin, TX 78701',
        createdAt: '2026-07-14T12:00:00Z',
        activityAt: '2026-07-14T15:00:00Z',
        viewedAt: '2026-07-14T13:10:00Z',
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
    expect(model.customerNote).toBe('Customer needs pet hair removed');
    expect(model.businessNote).toBe('Includes clay bar');
    expect(model.note).toBe('Includes clay bar');
    expect(model.createdAtIso).toBe('2026-07-14T12:00:00Z');
    expect(model.viewedAt).toBe(formatQuoteDetailTimestamp('2026-07-14T13:10:00Z'));
  });

  it('carries the quote lifecycle stamps for the activity timeline', () => {
    const model = mapQuoteDetailModel(
      {
        id: 's3',
        status: 'approved',
        source: 'owner_created',
        customerName: 'Rae',
        serviceName: 'Full detail',
        totalCents: 20000,
        createdAt: '2026-07-14T11:00:00Z',
        viewedAt: '2026-07-14T13:10:00Z',
        customerReminderSentAt: '2026-07-16T17:00:00Z',
        publicLinkExpiresAt: '2026-07-28T12:00:00Z',
        activityAt: '2026-07-14T15:00:00Z',
        communications: [
          {
            channel: 'sms',
            type: 'quote_reminder',
            status: 'sent',
            sentAt: '2026-07-16T17:01:00Z',
            toAddress: '4155550100',
          },
        ],
      },
      QUOTE_DETAIL_KIND_SENT,
    );

    expect(model.createdAtIso).toBe('2026-07-14T11:00:00Z');
    expect(model.viewedAtIso).toBe('2026-07-14T13:10:00Z');
    expect(model.reminderAtIso).toBe('2026-07-16T17:00:00Z');
    expect(model.expiresAtIso).toBe('2026-07-28T12:00:00Z');
    expect(model.communications).toHaveLength(1);
    expect(model.goodUntil).toMatch(/Jul 28, 2026/);
  });

  it('lists every vehicle a quote covers, request or sent', () => {
    const message =
      'Preferred timing: Flexible\nSecond vehicle: 2022 GMC Yukon AT4\n\nBoth please.';
    const row = {
      id: 'q5',
      business_id: 'b1',
      customer_name: 'Sam',
      vehicle_year: '2021',
      vehicle_make: 'GMC',
      vehicle_model: 'Sierra AT4',
      request_message: message,
      service_name: 'Full detail',
      status: 'requested',
      source: 'customer_requested',
      created_at: '2026-07-14T11:00:00Z',
    };

    expect(mapQuoteDetailModel(row, QUOTE_DETAIL_KIND_REQUEST, {}).vehicles).toEqual([
      '2021 GMC Sierra AT4',
      '2022 GMC Yukon AT4',
    ]);
    expect(
      mapQuoteDetailModel({ ...row, status: 'sent' }, QUOTE_DETAIL_KIND_SENT, {}).vehicles,
    ).toEqual(['2021 GMC Sierra AT4', '2022 GMC Yukon AT4']);
  });

  it('prefers assets labels over the single vehicle columns', () => {
    const model = mapQuoteDetailModel(
      {
        id: 'q6',
        status: 'sent',
        source: 'owner_created',
        customerName: 'Sam',
        vehicleYear: '2021',
        vehicleMake: 'GMC',
        vehicleModel: 'Sierra AT4',
        vehicleLine: '2021 GMC Sierra AT4',
        assets: [
          {
            type: 'vehicle',
            label: '2019 Audi Q5',
            attributes: { year: '2019', make: 'Audi', model: 'Q5' },
          },
          {
            type: 'vehicle',
            label: '2020 Kia Telluride',
            attributes: { year: '2020', make: 'Kia', model: 'Telluride' },
          },
        ],
        createdAt: '2026-07-14T11:00:00Z',
      },
      QUOTE_DETAIL_KIND_SENT,
    );

    expect(model.vehicles).toEqual(['2019 Audi Q5', '2020 Kia Telluride']);
    expect(model.vehicleYear).toBe('2019');
  });
});
