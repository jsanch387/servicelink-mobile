import {
  APP_REVIEW_MIN_COMPLETED_BOOKINGS,
  APP_REVIEW_PROMPT_COOLDOWN_DAYS,
} from '../../constants';
import { shouldRequestAppReview } from '../shouldRequestAppReview';

const NOW = new Date('2026-06-09T12:00:00.000Z');
const EMPTY_HISTORY = { lastPromptedAt: null, promptCount: 0 };

function daysAgo(days) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('shouldRequestAppReview', () => {
  it('rejects owners below the completed-bookings threshold', () => {
    expect(
      shouldRequestAppReview({
        completedBookingsCount: APP_REVIEW_MIN_COMPLETED_BOOKINGS - 1,
        history: EMPTY_HISTORY,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('allows long-time owners who have never been prompted', () => {
    expect(
      shouldRequestAppReview({
        completedBookingsCount: 50,
        history: EMPTY_HISTORY,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('allows exactly at the threshold', () => {
    expect(
      shouldRequestAppReview({
        completedBookingsCount: APP_REVIEW_MIN_COMPLETED_BOOKINGS,
        history: EMPTY_HISTORY,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('rejects while inside the cooldown window', () => {
    expect(
      shouldRequestAppReview({
        completedBookingsCount: 50,
        history: { lastPromptedAt: daysAgo(APP_REVIEW_PROMPT_COOLDOWN_DAYS - 1), promptCount: 1 },
        now: NOW,
      }),
    ).toBe(false);
  });

  it('allows again once the cooldown has elapsed', () => {
    expect(
      shouldRequestAppReview({
        completedBookingsCount: 50,
        history: { lastPromptedAt: daysAgo(APP_REVIEW_PROMPT_COOLDOWN_DAYS + 1), promptCount: 1 },
        now: NOW,
      }),
    ).toBe(true);
  });

  it('treats an unparseable lastPromptedAt as never prompted', () => {
    expect(
      shouldRequestAppReview({
        completedBookingsCount: 50,
        history: { lastPromptedAt: 'not-a-date', promptCount: 1 },
        now: NOW,
      }),
    ).toBe(true);
  });

  it('rejects non-numeric counts', () => {
    expect(
      shouldRequestAppReview({
        completedBookingsCount: /** @type {any} */ (undefined),
        history: EMPTY_HISTORY,
        now: NOW,
      }),
    ).toBe(false);
  });
});
