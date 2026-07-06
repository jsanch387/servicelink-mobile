export {
  isOnTheWayActionAvailable,
  isOnTheWayActionDone,
  normalizeJobStatus,
} from '../../bookings/constants/jobStatus';
export { isBookingActionConflictError as isOnMyWayAlreadySentError } from '../../bookings/utils/bookingActionErrors';

/** @deprecated Use {@link isOnTheWayActionDone}. */
export { isOnTheWayActionDone as isOnMyWaySent } from '../../bookings/constants/jobStatus';
