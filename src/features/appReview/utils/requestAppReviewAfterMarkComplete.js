import { fetchCompletedBookingCountForBusiness } from '../../bookings/api/bookings';
import { APP_REVIEW_PROMPT_DELAY_MS } from '../constants';
import {
  readAppReviewPromptHistory,
  recordAppReviewPromptAttempt,
} from '../storage/appReviewPromptHistory';
import { loadStoreReviewModule } from './loadStoreReviewModule';
import { shouldRequestAppReview } from './shouldRequestAppReview';

/**
 * Fire-and-forget App Store review prompt after mark-complete.
 * Kept out of the HomeScreen import graph so 1.0.6 OTA bundles stay safe
 * until the 1.0.7 native binary includes expo-store-review.
 *
 * @param {{ businessId?: string | null }} params
 */
export async function requestAppReviewAfterMarkComplete({ businessId } = {}) {
  try {
    const normalizedBusinessId = businessId?.trim();
    if (!normalizedBusinessId) {
      return;
    }

    const history = await readAppReviewPromptHistory();
    if (!shouldRequestAppReview({ completedBookingsCount: Infinity, history })) {
      return;
    }

    const { count, error } = await fetchCompletedBookingCountForBusiness(normalizedBusinessId);
    if (error || !shouldRequestAppReview({ completedBookingsCount: count, history })) {
      return;
    }

    const StoreReview = await loadStoreReviewModule();
    if (!StoreReview || !(await StoreReview.hasAction())) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, APP_REVIEW_PROMPT_DELAY_MS));

    await recordAppReviewPromptAttempt();
    await StoreReview.requestReview();
  } catch {
    /* never block the calling flow */
  }
}
