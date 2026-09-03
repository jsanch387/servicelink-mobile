import { formatQuoteActivityTimestamp } from './quotePresentation';

/**
 * @typedef {{ key: string; title: string; detail?: string; tone?: 'danger' }} QuoteActivityEvent
 */

const RANK = {
  created: 1,
  viewed: 2,
  reminder: 3,
  delivery: 4,
};

function toMs(value) {
  if (value == null || value === '') return null;
  const ms = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/**
 * `communications` from the quote payload — reminder email/SMS only.
 *
 * @param {unknown} list
 */
function normalizeCommunications(list) {
  return (Array.isArray(list) ? list : [])
    .map((row, index) => {
      const channel = String(row?.channel ?? '').toLowerCase();
      return {
        id: `${channel}-${row?.sentAt ?? row?.sent_at ?? index}`,
        channel,
        failed: String(row?.status ?? '').toLowerCase() === 'failed',
        at: toMs(row?.sentAt ?? row?.sent_at),
      };
    })
    .filter((row) => row.channel === 'sms' || row.channel === 'email');
}

function communicationTitle({ channel, failed }) {
  const noun = channel === 'email' ? 'Email' : 'Text';
  return `${noun} ${failed ? 'failed' : 'sent'}`;
}

/**
 * Owner timeline from the quote payload. Do not invent timestamps.
 *
 * @param {{
 *   createdAt?: string | number | null;
 *   viewedAt?: string | number | null;
 *   reminderAt?: string | number | null;
 *   communications?: unknown;
 *   nowMs?: number;
 * }} input
 * @returns {QuoteActivityEvent[]}
 */
export function buildSentQuoteActivityEvents({
  createdAt,
  viewedAt,
  reminderAt,
  communications,
  nowMs = Date.now(),
}) {
  /** @type {Array<{ key: string; title: string; at: number | null; rank: number; tone?: 'danger' }>} */
  const entries = [];

  const createdMs = toMs(createdAt);
  if (createdMs != null) {
    entries.push({ key: 'created', title: 'Created', at: createdMs, rank: RANK.created });
  }

  const viewedMs = toMs(viewedAt);
  if (viewedMs != null) {
    entries.push({ key: 'viewed', title: 'Viewed', at: viewedMs, rank: RANK.viewed });
  }

  const reminderMs = toMs(reminderAt);
  if (reminderMs != null) {
    entries.push({ key: 'reminder', title: 'Reminder', at: reminderMs, rank: RANK.reminder });
  }

  for (const row of normalizeCommunications(communications)) {
    entries.push({
      key: `delivery-${row.id}`,
      title: communicationTitle(row),
      at: row.at,
      rank: RANK.delivery,
      ...(row.failed ? { tone: 'danger' } : {}),
    });
  }

  entries.sort((a, b) => {
    if (a.at != null && b.at != null && a.at !== b.at) return a.at - b.at;
    return a.rank - b.rank;
  });

  return entries.map((entry) => ({
    key: entry.key,
    title: entry.title,
    ...(entry.at != null ? { detail: formatQuoteActivityTimestamp(entry.at, nowMs) } : {}),
    ...(entry.tone ? { tone: entry.tone } : {}),
  }));
}

/**
 * @param {{ receivedAt?: string | null }} input
 * @returns {QuoteActivityEvent[]}
 */
export function buildQuoteRequestActivityEvents({ receivedAt }) {
  const received = String(receivedAt ?? '').trim();
  if (!received || received === '—') return [];
  return [{ key: 'received', title: 'Received', detail: received }];
}
