import { parseGoogleReviewConnectionStatus } from '../fetchGoogleReviewConnectionStatus';

describe('parseGoogleReviewConnectionStatus', () => {
  it('reads a connected business', () => {
    expect(
      parseGoogleReviewConnectionStatus({
        success: true,
        connected: true,
        locationTitle: 'Northside Detail',
        lastSyncedAt: '2026-11-01T12:00:00.000Z',
      }),
    ).toEqual({
      connected: true,
      locationTitle: 'Northside Detail',
      lastSyncedAt: '2026-11-01T12:00:00.000Z',
    });
  });

  it('treats anything other than connected true as not linked', () => {
    expect(
      parseGoogleReviewConnectionStatus({
        success: true,
        connected: false,
        locationTitle: null,
        lastSyncedAt: null,
      }),
    ).toEqual({
      connected: false,
      locationTitle: null,
      lastSyncedAt: null,
    });
  });

  it('rejects a failed payload', () => {
    expect(parseGoogleReviewConnectionStatus({ success: false, connected: true })).toBeNull();
    expect(parseGoogleReviewConnectionStatus(null)).toBeNull();
  });
});
