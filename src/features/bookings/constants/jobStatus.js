/** `bookings.job_status` lifecycle values (server-owned). */
export const JOB_STATUS = Object.freeze({
  NOT_STARTED: 'not_started',
  ON_THE_WAY: 'on_the_way',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
});

/** Keys for `POST …/bookings/{id}/actions`. */
export const BOOKING_ACTION = Object.freeze({
  ON_THE_WAY: 'on_the_way',
  JOB_STARTED: 'job_started',
  JOB_COMPLETED: 'job_completed',
});

/**
 * @param {string | null | undefined} raw
 * @returns {string}
 */
export function normalizeJobStatus(raw) {
  const value = String(raw ?? JOB_STATUS.NOT_STARTED)
    .trim()
    .toLowerCase();
  if (Object.values(JOB_STATUS).includes(value)) {
    return value;
  }
  return JOB_STATUS.NOT_STARTED;
}

/**
 * Next owner action for the happy-path state machine.
 *
 * @param {string | null | undefined} jobStatus
 * @returns {string | null}
 */
export function getNextBookingAction(jobStatus) {
  const status = normalizeJobStatus(jobStatus);
  switch (status) {
    case JOB_STATUS.NOT_STARTED:
      return BOOKING_ACTION.ON_THE_WAY;
    case JOB_STATUS.ON_THE_WAY:
      return BOOKING_ACTION.JOB_STARTED;
    case JOB_STATUS.IN_PROGRESS:
      return BOOKING_ACTION.JOB_COMPLETED;
    default:
      return null;
  }
}

/**
 * @param {{ job_status?: string | null } | null | undefined} booking
 * @returns {boolean}
 */
export function isOnTheWayActionAvailable(booking) {
  return getNextBookingAction(booking?.job_status) === BOOKING_ACTION.ON_THE_WAY;
}

/**
 * Owner already ran `on_the_way` (or skipped ahead) — hide the on-my-way CTA.
 *
 * @param {{ job_status?: string | null } | null | undefined} booking
 * @returns {boolean}
 */
export function isOnTheWayActionDone(booking) {
  return normalizeJobStatus(booking?.job_status) !== JOB_STATUS.NOT_STARTED;
}
