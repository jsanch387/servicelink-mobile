import { isOnMyWayAlreadySentError, isOnMyWaySent } from '../utils/bookingOnMyWay';

describe('bookingOnMyWay', () => {
  describe('isOnMyWaySent', () => {
    it('returns false when job_status is not_started or missing', () => {
      expect(isOnMyWaySent(null)).toBe(false);
      expect(isOnMyWaySent({})).toBe(false);
      expect(isOnMyWaySent({ job_status: 'not_started' })).toBe(false);
    });

    it('returns true when job_status moved past not_started', () => {
      expect(isOnMyWaySent({ job_status: 'on_the_way' })).toBe(true);
      expect(isOnMyWaySent({ job_status: 'in_progress' })).toBe(true);
    });
  });

  describe('isOnMyWayAlreadySentError', () => {
    it('detects conflict errors', () => {
      expect(
        isOnMyWayAlreadySentError('On my way text was already sent for this appointment.'),
      ).toBe(true);
      expect(isOnMyWayAlreadySentError('Customer was already notified.')).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(isOnMyWayAlreadySentError('This appointment is no longer confirmed.')).toBe(false);
    });
  });
});
