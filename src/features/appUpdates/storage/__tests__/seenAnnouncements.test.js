import { parseSeenAnnouncementIds, SEEN_APP_UPDATE_ANNOUNCEMENTS_KEY } from '../seenAnnouncements';

describe('parseSeenAnnouncementIds', () => {
  it('returns empty array for null, empty, or invalid json', () => {
    expect(parseSeenAnnouncementIds(null)).toEqual([]);
    expect(parseSeenAnnouncementIds('')).toEqual([]);
    expect(parseSeenAnnouncementIds('not-json')).toEqual([]);
    expect(parseSeenAnnouncementIds('{}')).toEqual([]);
  });

  it('filters non-strings and blank ids', () => {
    expect(parseSeenAnnouncementIds(JSON.stringify(['a', '', '  ', 1, null, 'b']))).toEqual([
      'a',
      'b',
    ]);
  });
});

describe('SEEN_APP_UPDATE_ANNOUNCEMENTS_KEY', () => {
  it('is stable for persistence', () => {
    expect(SEEN_APP_UPDATE_ANNOUNCEMENTS_KEY).toBe('servicelink.seenAppUpdateAnnouncements');
  });
});
