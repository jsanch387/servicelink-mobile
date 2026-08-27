import {
  buildBookingActivityModel,
  formatActivityMetaLine,
  formatActivityStatusLine,
  formatActivityWhen,
  isFailedActivitySmsStatus,
  isSuccessfulActivitySmsStatus,
} from '../utils/buildBookingActivityModel';

describe('isSuccessfulActivitySmsStatus', () => {
  it('accepts queued, sent, and delivered', () => {
    expect(isSuccessfulActivitySmsStatus('sent')).toBe(true);
    expect(isSuccessfulActivitySmsStatus('delivered')).toBe(true);
    expect(isSuccessfulActivitySmsStatus('queued')).toBe(true);
  });

  it('does not treat failed or skipped as success', () => {
    expect(isSuccessfulActivitySmsStatus('failed')).toBe(false);
    expect(isSuccessfulActivitySmsStatus('skipped_opt_out')).toBe(false);
  });
});

describe('isFailedActivitySmsStatus', () => {
  it('treats failed and opted-out as failed', () => {
    expect(isFailedActivitySmsStatus('failed')).toBe(true);
    expect(isFailedActivitySmsStatus('skipped_opt_out')).toBe(true);
  });
});

describe('formatActivityWhen', () => {
  it('returns an empty string for missing dates', () => {
    expect(formatActivityWhen('')).toBe('');
    expect(formatActivityWhen('not-a-date')).toBe('');
  });
});

describe('formatActivityStatusLine', () => {
  it('says Sent with a time', () => {
    expect(formatActivityStatusLine('sent', 'Aug 3 · 10:01 AM')).toBe('Sent · Aug 3 · 10:01 AM');
  });

  it('says Didn’t send, and mentions opt out', () => {
    expect(formatActivityStatusLine('failed', 'Aug 3 · 10:01 AM')).toBe(
      "Didn't send · Aug 3 · 10:01 AM",
    );
    expect(formatActivityStatusLine('failed', '', { optedOut: true })).toBe(
      "Didn't send · they opted out",
    );
  });
});

describe('formatActivityMetaLine', () => {
  it('names the channel', () => {
    expect(formatActivityMetaLine('text', 'Aug 3 · 10:01 AM')).toBe('Text · Aug 3 · 10:01 AM');
    expect(formatActivityMetaLine('email', '')).toBe('Email');
  });
});

describe('buildBookingActivityModel', () => {
  it('does not invent invoice or other placeholder rows', () => {
    expect(buildBookingActivityModel({})).toEqual([]);
  });

  it('shows confirmation email when the booking has an email', () => {
    const events = buildBookingActivityModel({ customerEmail: 'jordan@email.com' });
    expect(events.map((event) => event.key)).toEqual(['confirmation-email']);
    expect(events[0].channel).toBe('email');
    expect(events[0].title).toBe('Confirmation');
    expect(events[0].statusLine).toBe('Sent');
  });

  it('shows confirmation email and text as two rows', () => {
    const events = buildBookingActivityModel({
      customerEmail: 'jordan@email.com',
      smsRows: [{ type: 'booking_confirmation', status: 'sent', sent_at: '2026-08-01T10:01:00Z' }],
    });
    expect(events.map((event) => `${event.title}:${event.channel}`)).toEqual([
      'Confirmation:text',
      'Confirmation:email',
    ]);
  });

  it('prefers a later successful confirmation text over a failed one', () => {
    const events = buildBookingActivityModel({
      smsRows: [
        { type: 'booking_confirmation', status: 'failed', created_at: '2026-08-01T10:00:00Z' },
        { type: 'booking_confirmation', status: 'sent', sent_at: '2026-08-01T10:01:00Z' },
      ],
    });
    const row = events.find((event) => event.key === 'confirmation-sms');
    expect(row.outcome).toBe('sent');
    expect(row.statusLine.startsWith('Sent')).toBe(true);
  });

  it('shows a confirmation text that only failed', () => {
    const events = buildBookingActivityModel({
      smsRows: [
        { type: 'booking_confirmation', status: 'failed', created_at: '2026-08-01T10:00:00Z' },
      ],
    });
    expect(events.map((event) => event.key)).toEqual(['confirmation-sms']);
    expect(events[0].outcome).toBe('failed');
    expect(events[0].statusLine.startsWith("Didn't send")).toBe(true);
  });

  it('maps booking_reminder SMS', () => {
    const events = buildBookingActivityModel({
      smsRows: [{ type: 'booking_reminder', status: 'sent', sent_at: '2026-08-02T09:00:00Z' }],
    });
    expect(events.map((event) => event.key)).toEqual(['reminder-sms']);
  });

  it('lists visit texts newest first', () => {
    const events = buildBookingActivityModel({
      smsRows: [
        { type: 'on_the_way', status: 'sent', sent_at: '2026-08-03T12:00:00Z' },
        { type: 'job_started', status: 'sent', sent_at: '2026-08-03T12:10:00Z' },
        { type: 'work_finished', status: 'sent', sent_at: '2026-08-03T13:00:00Z' },
      ],
    });
    expect(events.map((event) => event.key)).toEqual([
      'work-finished',
      'job-started',
      'on-the-way',
    ]);
  });

  it('shows cancellation email only when the booking is canceled', () => {
    const open = buildBookingActivityModel({ bookingStatus: 'confirmed' });
    expect(open.some((event) => event.key === 'cancellation-email')).toBe(false);

    const canceled = buildBookingActivityModel({ bookingStatus: 'cancelled' });
    expect(canceled.map((event) => event.key)).toEqual(['cancellation-email']);
  });

  it('shows receipt and review request after complete', () => {
    const events = buildBookingActivityModel({
      smsRows: [{ type: 'job_completed', status: 'sent', sent_at: '2026-08-03T14:00:00Z' }],
      reviewInvite: { email_sent_at: '2026-08-03T14:00:05Z' },
    });
    expect(events.map((event) => event.key)).toEqual(['review-email', 'receipt-sms']);
  });
});
