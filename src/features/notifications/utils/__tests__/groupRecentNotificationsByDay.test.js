import {
  bucketNotificationDay,
  groupRecentNotificationsByDay,
  startOfLocalDayMs,
} from '../groupRecentNotificationsByDay';

describe('startOfLocalDayMs', () => {
  it('returns local midnight for a given afternoon', () => {
    const d = new Date(2026, 4, 9, 15, 30, 0);
    const start = startOfLocalDayMs(d);
    const sameDayMorning = new Date(2026, 4, 9, 0, 0, 0).getTime();
    expect(start).toBe(sameDayMorning);
  });
});

describe('bucketNotificationDay', () => {
  const now = new Date(2026, 4, 9, 14, 0, 0);

  it('buckets same local calendar day as today', () => {
    const morning = new Date(2026, 4, 9, 8, 0, 0).toISOString();
    expect(bucketNotificationDay(morning, now)).toBe('today');
  });

  it('buckets previous local calendar day as yesterday', () => {
    const prev = new Date(2026, 4, 8, 22, 0, 0).toISOString();
    expect(bucketNotificationDay(prev, now)).toBe('yesterday');
  });

  it('buckets two+ days back as older', () => {
    const old = new Date(2026, 4, 6, 12, 0, 0).toISOString();
    expect(bucketNotificationDay(old, now)).toBe('older');
  });

  it('treats invalid iso as older', () => {
    expect(bucketNotificationDay('', now)).toBe('older');
    expect(bucketNotificationDay('not-a-date', now)).toBe('older');
  });
});

describe('groupRecentNotificationsByDay', () => {
  const now = new Date(2026, 4, 9, 12, 0, 0);

  it('returns ordered sections Today, Yesterday, Older with only non-empty sections', () => {
    const items = [
      { id: '1', createdAt: new Date(2026, 4, 9, 10, 0).toISOString() },
      { id: '2', createdAt: new Date(2026, 4, 8, 18, 0).toISOString() },
      { id: '3', createdAt: new Date(2026, 4, 1, 9, 0).toISOString() },
    ];
    const sections = groupRecentNotificationsByDay(items, now);
    expect(sections.map((s) => s.title)).toEqual(['Today', 'Yesterday', 'Older']);
    expect(sections[0].data.map((i) => i.id)).toEqual(['1']);
    expect(sections[1].data.map((i) => i.id)).toEqual(['2']);
    expect(sections[2].data.map((i) => i.id)).toEqual(['3']);
  });

  it('omits empty sections', () => {
    const items = [{ id: 'a', createdAt: new Date(2026, 4, 9, 1, 0).toISOString() }];
    const sections = groupRecentNotificationsByDay(items, now);
    expect(sections).toEqual([{ title: 'Today', data: items }]);
  });

  it('preserves API order within each bucket', () => {
    const items = [
      { id: 'newer', createdAt: new Date(2026, 4, 9, 11, 0).toISOString() },
      { id: 'older', createdAt: new Date(2026, 4, 9, 9, 0).toISOString() },
    ];
    const sections = groupRecentNotificationsByDay(items, now);
    expect(sections[0].data.map((i) => i.id)).toEqual(['newer', 'older']);
  });
});
