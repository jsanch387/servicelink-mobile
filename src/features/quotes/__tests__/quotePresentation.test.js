import { QUOTE_DETAIL_KIND_REQUEST, QUOTE_DETAIL_KIND_SENT } from '../constants';
import {
  deriveQuoteDetailKind,
  formatOwnerFacingQuoteStatus,
  mapQuoteDetailModel,
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
      service_name: 'Wash',
      price_cents: 5000,
      status: 'approved',
    };
    const card = mapSentQuoteCard(row);
    expect(card.statusRaw).toBe('approved');
    expect(card.statusLabel).toBe(formatOwnerFacingQuoteStatus('approved'));
    expect(card.customerName).toBe('Alex');
    expect(card.line).toContain('Wash');
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
      created_at: '2026-01-01T12:00:00Z',
      updated_at: '2026-01-01T12:00:00Z',
    };
    const model = mapQuoteDetailModel(row, QUOTE_DETAIL_KIND_REQUEST, {});
    expect(model.customerName).toBe('Casey');
    expect(model.message).toBe('Please quote');
    expect(model.vehicleMake).toBe('Honda');
    expect(model.scheduledDateYyyyMmDd).toBe('2026-06-10');
    expect(model.scheduledStartTime12h).toMatch(/2:30 PM/i);
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
});
