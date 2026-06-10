import { APP_REVIEW_MIN_COMPLETED_BOOKINGS, APP_REVIEW_PROMPT_COOLDOWN_DAYS } from '../constants';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pure eligibility check for showing the app-store review prompt.
 *
 * @param {{
 *   completedBookingsCount: number;
 *   history: import('../storage/appReviewPromptHistory').AppReviewPromptHistory;
 *   now?: Date;
 * }} params
 * @returns {boolean}
 */
export function shouldRequestAppReview({ completedBookingsCount, history, now = new Date() }) {
  if (
    typeof completedBookingsCount !== 'number' ||
    completedBookingsCount < APP_REVIEW_MIN_COMPLETED_BOOKINGS
  ) {
    return false;
  }

  if (!history.lastPromptedAt) {
    return true;
  }

  const lastPromptedMs = Date.parse(history.lastPromptedAt);
  if (Number.isNaN(lastPromptedMs)) {
    return true;
  }

  const elapsedMs = now.getTime() - lastPromptedMs;
  return elapsedMs >= APP_REVIEW_PROMPT_COOLDOWN_DAYS * DAY_MS;
}
