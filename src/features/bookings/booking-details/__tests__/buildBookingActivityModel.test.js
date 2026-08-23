import {
  buildBookingActivityModel,
  isSuccessfulActivitySmsStatus,
} from '../utils/buildBookingActivityModel';

describe('isSuccessfulActivitySmsStatus', () => {
  it('accepts queued, sent, and delivered', () => {
    expect(isSuccessfulActivitySmsStatus('sent')).toBe(true);
    expect(isSuccessfulActivitySmsStatus('delivered')).toBe(true);
    expect(isSuccessfulActivitySmsStatus('queued')).toBe(true);
  });

  it('hides failed and skipped texts', () => {
    expect(isSuccessfulActivitySmsStatus('failed')).toBe(false);
    expect(isSuccessfulActivitySmsStatus('skipped_opt_out')).toBe(false);
  });
});

describe('buildBookingActivityModel', () => {
  it('does not invent invoice or other placeholder rows', () => {
    expect(buildBookingActivityModel({})).toEqual([]);
  });

  it('shows confirmation email when the booking has an email', () => {
    const groups = buildBookingActivityModel({ customerEmail: 'jordan@email.com' });
    const booked = groups.find((group) => group.id === 'booked');
    expect(booked.events.map((event) => event.key)).toEqual(['confirmation-email']);
  });

  it('shows successful confirmation text and hides a failed one', () => {
    const groups = buildBookingActivityModel({
      smsRows: [
        { type: 'booking_confirmation', status: 'failed', created_at: '2026-08-01T10:00:00Z' },
        { type: 'booking_confirmation', status: 'sent', sent_at: '2026-08-01T10:01:00Z' },
      ],
    });
    const booked = groups.find((group) => group.id === 'booked');
    expect(booked.events.some((event) => event.key === 'confirmation-sms')).toBe(true);
  });

  it('does not show a confirmation text that only failed', () => {
    const groups = buildBookingActivityModel({
      smsRows: [{ type: 'booking_confirmation', status: 'failed', created_at: '2026-08-01T10:00:00Z' }],
    });
    const booked = groups.find((group) => group.id === 'booked');
    expect(booked).toBeUndefined();
  });

  it('maps booking_reminder SMS into Before the visit', () => {
    const groups = buildBookingActivityModel({
      smsRows: [{ type: 'booking_reminder', status: 'sent', sent_at: '2026-08-02T09:00:00Z' }],
    });
    const upcoming = groups.find((group) => group.id === 'upcoming');
    expect(upcoming.events.map((event) => event.key)).toEqual(['reminder-sms']);
  });

  it('groups on the way, job started, and job done under During the visit', () => {
    const groups = buildBookingActivityModel({
      smsRows: [
        { type: 'on_the_way', status: 'sent', sent_at: '2026-08-03T12:00:00Z' },
        { type: 'job_started', status: 'sent', sent_at: '2026-08-03T12:10:00Z' },
        { type: 'work_finished', status: 'sent', sent_at: '2026-08-03T13:00:00Z' },
      ],
    });
    const during = groups.find((group) => group.id === 'during');
    expect(during.events.map((event) => event.key)).toEqual([
      'on-the-way',
      'job-started',
      'work-finished',
    ]);
  });

  it('shows cancellation email only when the booking is canceled', () => {
    const open = buildBookingActivityModel({ bookingStatus: 'confirmed' });
    expect(open.some((group) => group.id === 'canceled')).toBe(false);

    const canceled = buildBookingActivityModel({ bookingStatus: 'cancelled' });
    const group = canceled.find((item) => item.id === 'canceled');
    expect(group.events.map((event) => event.key)).toEqual(['cancellation-email']);
  });

  it('shows receipt text and review link from complete SMS and review invite', () => {
    const groups = buildBookingActivityModel({
      smsRows: [{ type: 'job_completed', status: 'sent', sent_at: '2026-08-03T14:00:00Z' }],
      reviewInvite: { email_sent_at: '2026-08-03T14:00:05Z' },
    });
    const after = groups.find((group) => group.id === 'after');
    expect(after.events.map((event) => event.key)).toEqual(['receipt-sms', 'review-link']);
  });
});
