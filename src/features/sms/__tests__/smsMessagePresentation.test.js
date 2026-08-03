import {
  buildSentTextsDesignPreviewItems,
  mapSmsMessageRowToTimelineItem,
  smsMessageStatusPresentation,
  smsMessageTypeIcon,
  smsMessageTypeLabel,
  stripSmsOptOutFooterForDisplay,
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

  it('strips the STOP opt-out footer for Texts sent display only', () => {
    expect(
      stripSmsOptOutFooterForDisplay(
        'Your appointment is confirmed for Tuesday at 1:00 PM.\n\nReply STOP to opt out.',
      ),
    ).toBe('Your appointment is confirmed for Tuesday at 1:00 PM.');
    expect(
      stripSmsOptOutFooterForDisplay('Sparkle Auto is on the way. Reply STOP to unsubscribe'),
    ).toBe('Sparkle Auto is on the way.');
    expect(stripSmsOptOutFooterForDisplay('Service has started.')).toBe('Service has started.');
  });

  it('maps a database row into a timeline item without exposing raw server error codes', () => {
    const item = mapSmsMessageRowToTimelineItem({
      id: 'm1',
      type: 'booking_confirmation',
      body: 'Your appointment is confirmed.\n\nReply STOP to opt out.',
      status: 'failed',
      to_phone: '+15551234567',
      sent_at: '2026-08-02T18:00:00.000Z',
      created_at: '2026-08-02T18:00:00.000Z',
      error: 'not_configured',
    });

    expect(item.id).toBe('m1');
    expect(item.title).toBe('Booking confirmation');
    expect(item.statusLabel).toBe('Failed');
    expect(item.statusTone).toBe('danger');
    expect(item.body).toBe('Your appointment is confirmed.');
    expect(item.error).toBeUndefined();
  });

  it('builds design preview rows for empty history', () => {
    const items = buildSentTextsDesignPreviewItems();
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.every((row) => row.id && row.title && row.statusLabel && row.iconName)).toBe(true);
  });
});
