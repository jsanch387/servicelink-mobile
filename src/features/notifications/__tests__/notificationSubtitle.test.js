import { mapNotificationRowToInboxItem } from '../utils/notificationInboxPresentation';
import { notificationSubtitle } from '../utils/notificationSubtitle';

describe('notificationSubtitle', () => {
  it('uses metadata customerName', () => {
    expect(notificationSubtitle({ customerName: 'James' }, 'x', 'New appointment', null)).toBe(
      'From James',
    );
  });

  it('parses legacy title when headline is minimal', () => {
    expect(notificationSubtitle(null, 'New appointment from James', 'New appointment', null)).toBe(
      'From James',
    );
  });

  it('prefers explicit inboxSubtitle', () => {
    expect(notificationSubtitle({ inboxSubtitle: 'From Alex M.' }, 'x', 'New quote', null)).toBe(
      'From Alex M.',
    );
  });

  it('prefixes From when explicit subtitle is a bare name', () => {
    expect(notificationSubtitle({ subtitle: 'Alex' }, 'x', 'New appointment', null)).toBe(
      'From Alex',
    );
  });
});

describe('mapNotificationRowToInboxItem subtitle integration', () => {
  it('maps subtitle from metadata', () => {
    const item = mapNotificationRowToInboxItem({
      id: '1',
      user_id: 'u',
      type: 'booking.scheduled',
      reference_type: 'booking',
      reference_id: 'b1',
      title: 'Anything',
      body: null,
      read: false,
      read_at: null,
      created_at: new Date().toISOString(),
      metadata: { customerName: 'Jordan' },
    });
    expect(item.displayTitle).toBe('New appointment');
    expect(item.subtitle).toBe('From Jordan');
  });
});
