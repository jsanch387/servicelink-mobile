import { isOnMyWayAlreadySentError, isOnMyWaySent } from '../utils/bookingOnMyWay';

describe('bookingOnMyWay', () => {
  describe('isOnMyWaySent', () => {
    it('returns false when timestamp is missing', () => {
      expect(isOnMyWaySent(null)).toBe(false);
      expect(isOnMyWaySent({})).toBe(false);
      expect(isOnMyWaySent({ on_my_way_sent_at: null })).toBe(false);
      expect(isOnMyWaySent({ on_my_way_sent_at: '   ' })).toBe(false);
    });

    it('returns true when timestamp is set', () => {
      expect(isOnMyWaySent({ on_my_way_sent_at: '2026-06-10T20:00:00.000Z' })).toBe(true);
    });
  });

  describe('isOnMyWayAlreadySentError', () => {
    it('detects already-sent server messages', () => {
      expect(
        isOnMyWayAlreadySentError('On my way text was already sent for this appointment.'),
      ).toBe(true);
      expect(isOnMyWayAlreadySentError('Customer was already notified.')).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isOnMyWayAlreadySentError('This appointment is no longer confirmed.')).toBe(false);
    });
  });
});
