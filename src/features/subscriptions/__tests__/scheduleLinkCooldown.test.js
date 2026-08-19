import {
  MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MESSAGE,
  createMembershipScheduleLinkGuard,
  resolveScheduleLinkCooldownSec,
} from '../utils/scheduleLinkCooldown';

describe('resolveScheduleLinkCooldownSec', () => {
  it('uses Retry-After when present', () => {
    expect(resolveScheduleLinkCooldownSec(120)).toBe(120);
  });

  it('falls back to 10 minutes', () => {
    expect(resolveScheduleLinkCooldownSec(undefined)).toBe(600);
  });
});

describe('createMembershipScheduleLinkGuard', () => {
  it('blocks a second send while the first is in flight', () => {
    const guard = createMembershipScheduleLinkGuard({ now: () => 0 });
    expect(guard.begin('sub-1').ok).toBe(true);
    const blocked = guard.begin('sub-1');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.message).toBe(MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MESSAGE);
      expect(blocked.httpStatus).toBe(429);
    }
  });

  it('blocks another send during the success cooldown', () => {
    let now = 0;
    const guard = createMembershipScheduleLinkGuard({
      cooldownSec: 600,
      now: () => now,
    });
    expect(guard.begin('sub-1').ok).toBe(true);
    guard.succeed('sub-1');
    const blocked = guard.begin('sub-1');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBe(600);
    }
    now = 600 * 1000;
    expect(guard.begin('sub-1').ok).toBe(true);
  });

  it('starts cooldown from a 429 without sending again', () => {
    const guard = createMembershipScheduleLinkGuard({ now: () => 0 });
    expect(guard.begin('sub-1').ok).toBe(true);
    guard.fail('sub-1', { httpStatus: 429, retryAfterSec: 90 });
    const blocked = guard.begin('sub-1');
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSec).toBe(90);
    }
  });

  it('does not cooldown on a generic failure', () => {
    const guard = createMembershipScheduleLinkGuard({ now: () => 0 });
    expect(guard.begin('sub-1').ok).toBe(true);
    guard.fail('sub-1', { httpStatus: 500 });
    expect(guard.begin('sub-1').ok).toBe(true);
  });
});
