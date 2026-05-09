/**
 * Dev fixtures only — owner Quotes screens load from Supabase (`quotes` + `business_profiles`).
 * Keep these rows if you want a quick Storybook-style harness later.
 */

import { QUOTE_DETAIL_KIND_REQUEST, QUOTE_DETAIL_KIND_SENT } from './constants';

export const MOCK_QUOTE_REQUESTS = [
  {
    id: 'mock-req-1',
    customerName: 'Jordan Lee',
    summary: 'Full interior + exterior',
    receivedLabel: 'Today · 9:14 AM',
    email: 'jordan@example.com',
    phone: '(512) 555-0101',
    vehicle: '2019 Honda Civic',
    message: 'Flexible after 3pm. Interested in pet-hair add-on if available.',
    receivedAt: 'May 8, 2026 · 9:14 AM',
  },
  {
    id: 'mock-req-2',
    customerName: 'Sam Rivera',
    summary: 'Ceramic coating (SUV)',
    receivedLabel: 'Yesterday',
    email: '',
    phone: '(305) 555-0199',
    vehicle: '2021 Ford Explorer',
    message: 'First time customer — referral from Instagram.',
    receivedAt: 'May 7, 2026 · 4:22 PM',
  },
  {
    id: 'mock-req-3',
    customerName: 'Taylor Brooks',
    summary: 'Paint correction — 2-stage',
    receivedLabel: 'May 6',
    email: 'taylor.b@example.com',
    phone: '',
    vehicle: '2016 BMW 328i',
    message: 'Minor swirl marks on hood and driver door.',
    receivedAt: 'May 6, 2026 · 11:05 AM',
  },
];

export const MOCK_SENT_QUOTES = [
  {
    id: 'mock-sent-1',
    customerName: 'Alex Kim',
    line: 'Express detail · $95',
    statusLabel: 'Pending',
    email: 'alex.kim@example.com',
    phone: '(415) 555-0142',
    sentAt: 'May 7, 2026 · 2:10 PM',
    goodUntil: 'May 14, 2026',
    quoteSummary: 'Express exterior wash, tire shine, interior vacuum.',
    linkHint: 'Customer opens your quote from the link you sent.',
  },
  {
    id: 'mock-sent-2',
    customerName: 'Morgan Patel',
    line: 'Interior only · $140',
    statusLabel: 'Pending',
    email: 'morgan.p@example.com',
    phone: '(737) 555-0166',
    sentAt: 'May 6, 2026 · 10:00 AM',
    goodUntil: 'May 13, 2026',
    quoteSummary: 'Full interior shampoo, mats, vents, leather conditioner.',
    linkHint: 'Waiting on customer response.',
  },
  {
    id: 'mock-sent-3',
    customerName: 'Riley Chen',
    line: 'Full package · $285',
    statusLabel: 'Viewed',
    email: 'riley@example.com',
    phone: '(206) 555-0188',
    sentAt: 'May 5, 2026 · 9:30 AM',
    goodUntil: 'May 12, 2026',
    quoteSummary: 'Full detail inside and out, engine bay wipe-down.',
    linkHint: 'Customer opened the quote link.',
  },
];

/**
 * @param {typeof QUOTE_DETAIL_KIND_REQUEST | typeof QUOTE_DETAIL_KIND_SENT} kind
 * @param {string | undefined} quoteId
 */
export function getMockQuoteDetail(kind, quoteId) {
  if (!quoteId) return null;
  if (kind === QUOTE_DETAIL_KIND_REQUEST) {
    return MOCK_QUOTE_REQUESTS.find((r) => r.id === quoteId) ?? null;
  }
  if (kind === QUOTE_DETAIL_KIND_SENT) {
    return MOCK_SENT_QUOTES.find((r) => r.id === quoteId) ?? null;
  }
  return null;
}
