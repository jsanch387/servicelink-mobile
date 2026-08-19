export const MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_SEC = 10 * 60;
export const MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MESSAGE =
  'Already sent. Try again in a few minutes.';

const MAX_COOLDOWN_SEC = 60 * 60;

/**
 * @param {unknown} retryAfterSec
 * @param {number} [fallbackSec]
 * @returns {number}
 */
export function resolveScheduleLinkCooldownSec(
  retryAfterSec,
  fallbackSec = MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_SEC,
) {
  const n = Number(retryAfterSec);
  if (Number.isFinite(n) && n > 0) {
    return Math.min(Math.ceil(n), MAX_COOLDOWN_SEC);
  }
  return fallbackSec;
}

/**
 * Prevents overlapping sends and honors the 10-minute / Retry-After throttle locally.
 *
 * @param {{ cooldownSec?: number; now?: () => number }} [args]
 */
export function createMembershipScheduleLinkGuard({
  cooldownSec = MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_SEC,
  now = () => Date.now(),
} = {}) {
  const inFlight = new Set();
  const cooldownUntilMs = new Map();

  /**
   * @param {string} subscriberId
   * @returns {number}
   */
  function remainingSec(subscriberId) {
    const until = cooldownUntilMs.get(subscriberId) ?? 0;
    return Math.max(0, Math.ceil((until - now()) / 1000));
  }

  /**
   * @param {string} subscriberId
   * @param {number} seconds
   */
  function startCooldown(subscriberId, seconds) {
    cooldownUntilMs.set(
      subscriberId,
      now() + resolveScheduleLinkCooldownSec(seconds, cooldownSec) * 1000,
    );
  }

  /**
   * @param {string} subscriberId
   * @returns {
   *   | { ok: true }
   *   | { ok: false; error: Error; httpStatus: number; retryAfterSec: number }
   * }
   */
  function begin(subscriberId) {
    const id = String(subscriberId ?? '').trim();
    if (!id) {
      return {
        ok: false,
        error: new Error('Missing subscriber'),
        httpStatus: 0,
        retryAfterSec: 0,
      };
    }
    const left = remainingSec(id);
    if (left > 0 || inFlight.has(id)) {
      return {
        ok: false,
        error: new Error(MEMBERSHIP_SCHEDULE_LINK_COOLDOWN_MESSAGE),
        httpStatus: 429,
        retryAfterSec: left || cooldownSec,
      };
    }
    inFlight.add(id);
    return { ok: true };
  }

  /**
   * @param {string} subscriberId
   * @param {number} [retryAfterSec]
   */
  function succeed(subscriberId, retryAfterSec) {
    const id = String(subscriberId ?? '').trim();
    inFlight.delete(id);
    startCooldown(id, retryAfterSec ?? cooldownSec);
  }

  /**
   * @param {string} subscriberId
   * @param {{ httpStatus?: number; retryAfterSec?: number }} [err]
   */
  function fail(subscriberId, err = {}) {
    const id = String(subscriberId ?? '').trim();
    inFlight.delete(id);
    if (Number(err.httpStatus) === 429) {
      startCooldown(id, err.retryAfterSec ?? cooldownSec);
    }
  }

  return { begin, succeed, fail, remainingSec };
}
