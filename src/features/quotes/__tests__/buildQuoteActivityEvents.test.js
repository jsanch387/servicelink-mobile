import {
  buildQuoteRequestActivityEvents,
  buildSentQuoteActivityEvents,
} from '../utils/buildQuoteActivityEvents';

const NOW_MS = new Date('2026-09-05T12:00:00').getTime();
const CREATED_AT = '2026-09-01T00:09:00';
const VIEWED_AT = '2026-09-01T11:02:00';
const REMINDER_AT = '2026-09-03T12:00:00';

function build(input) {
  return buildSentQuoteActivityEvents({ nowMs: NOW_MS, ...input });
}

describe('buildSentQuoteActivityEvents', () => {
  it('starts with created from the quote payload', () => {
    const events = build({ createdAt: CREATED_AT });

    expect(events).toEqual([{ key: 'created', title: 'Created', detail: 'Sep 1, 12:09 AM' }]);
  });

  it('adds viewed only when viewedAt is set', () => {
    const events = build({ createdAt: CREATED_AT, viewedAt: VIEWED_AT });

    expect(events.map((event) => event.title)).toEqual(['Created', 'Viewed']);
    expect(events[1].detail).toBe('Sep 1, 11:02 AM');
  });

  it('does not invent viewed from status', () => {
    const events = build({ createdAt: CREATED_AT });
    expect(events.some((event) => event.key === 'viewed')).toBe(false);
  });

  it('threads reminder communications as email and text', () => {
    const events = build({
      createdAt: CREATED_AT,
      viewedAt: VIEWED_AT,
      communications: [
        { channel: 'email', type: 'quote_reminder', status: 'sent', sentAt: REMINDER_AT },
        { channel: 'sms', type: 'quote_reminder', status: 'sent', sentAt: REMINDER_AT },
      ],
    });

    expect(events.map((event) => event.title)).toEqual([
      'Created',
      'Viewed',
      'Email sent',
      'Text sent',
    ]);
  });

  it('flags a failed text', () => {
    const events = build({
      createdAt: CREATED_AT,
      communications: [
        { channel: 'sms', type: 'quote_reminder', status: 'failed', sentAt: CREATED_AT },
      ],
    });

    expect(events[1]).toEqual({
      key: 'delivery-sms-2026-09-01T00:09:00',
      title: 'Text failed',
      detail: 'Sep 1, 12:09 AM',
      tone: 'danger',
    });
  });

  it('shows the reminder claim separately from channel sends', () => {
    const events = build({
      createdAt: CREATED_AT,
      reminderAt: REMINDER_AT,
      communications: [
        { channel: 'sms', type: 'quote_reminder', status: 'sent', sentAt: REMINDER_AT },
      ],
    });

    expect(events.map((event) => event.title)).toEqual(['Created', 'Reminder', 'Text sent']);
  });

  it('ignores channels it cannot label', () => {
    const events = build({
      createdAt: CREATED_AT,
      communications: [{ channel: 'push', type: 'quote_reminder', status: 'sent' }],
    });

    expect(events.map((event) => event.key)).toEqual(['created']);
  });

  it('keeps the year when the activity is from another year', () => {
    const events = build({ createdAt: '2025-09-01T00:09:00' });
    expect(events[0].detail).toBe('Sep 1, 2025, 12:09 AM');
  });
});

describe('buildQuoteRequestActivityEvents', () => {
  it('returns a received event', () => {
    expect(buildQuoteRequestActivityEvents({ receivedAt: 'Aug 31, 2026, 11:09 PM' })).toEqual([
      { key: 'received', title: 'Received', detail: 'Aug 31, 2026, 11:09 PM' },
    ]);
  });

  it('returns nothing without a time', () => {
    expect(buildQuoteRequestActivityEvents({ receivedAt: '—' })).toEqual([]);
  });
});
