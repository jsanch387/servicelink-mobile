import {
  buildSentTextsDesignPreviewItems,
  mapSmsMessageRowToTimelineItem,
  smsMessageStatusPresentation,
  smsMessageTypeIcon,
  smsMessageTypeLabel,
} from '../utils/smsMessagePresentation';

describe('smsMessagePresentation', () => {
  it('maps known SMS types to labels', () => {
    expect(smsMessageTypeLabel('on_the_way')).toBe('On the way');
    expect(smsMessageTypeLabel('booking_confirmation')).toBe('Booking confirmation');
    expect(smsMessageTypeLabel('custom_alert')).toBe('Custom Alert');
  });

  it('maps SMS types to compact icons', () => {
    expect(smsMessageTypeIcon('on_the_way')).toBe('navigate-outline');
    expect(smsMessageTypeIcon('reminder')).toBe('alarm-outline');
    expect(smsMessageTypeIcon('unknown_thing')).toBe('chatbubble-ellipses-outline');
  });

  it('maps status tones for timeline chips', () => {
    expect(smsMessageStatusPresentation('delivered')).toEqual({
      label: 'Delivered',
      tone: 'success',
    });
    expect(smsMessageStatusPresentation('failed')).toEqual({
      label: 'Failed',
      tone: 'danger',
    });
    expect(smsMessageStatusPresentation('skipped_opt_out')).toEqual({
      label: 'Skipped',
      tone: 'muted',
    });
  });

  it('maps a database row into a timeline item', () => {
    const item = mapSmsMessageRowToTimelineItem({
      id: 'm1',
      type: 'job_started',
      body: 'Service has started.',
      status: 'sent',
      to_phone: '+15551234567',
      sent_at: '2026-08-02T18:00:00.000Z',
      created_at: '2026-08-02T18:00:00.000Z',
      error: null,
    });

    expect(item.id).toBe('m1');
    expect(item.title).toBe('Job started');
    expect(item.iconName).toBe('play-outline');
    expect(item.statusLabel).toBe('Sent');
    expect(item.statusTone).toBe('success');
    expect(item.phoneDisplay).toContain('555');
    expect(item.body).toBe('Service has started.');
    expect(item.createdAt).toBe('2026-08-02T18:00:00.000Z');
  });

  it('builds design preview rows for empty history', () => {
    const items = buildSentTextsDesignPreviewItems();
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((row) => row.id && row.title && row.statusLabel && row.iconName)).toBe(true);
  });
});
