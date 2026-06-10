import { useCallback } from 'react';
import * as StoreReview from 'expo-store-review';
import { fetchCompletedBookingCountForBusiness } from '../../bookings/api/bookings';
import { APP_REVIEW_PROMPT_DELAY_MS } from '../constants';
import {
  readAppReviewPromptHistory,
  recordAppReviewPromptAttempt,
} from '../storage/appReviewPromptHistory';
import { shouldRequestAppReview } from '../utils/shouldRequestAppReview';

/**
 * Fire-and-forget app-store review prompt, intended for "happy moment" call sites
 * (e.g. right after an owner marks a visit complete).
 *
 * Eligibility is based on the business's lifetime completed-booking count from the
 * server, so long-time owners qualify on their first happy moment after this ships.
 * Never throws; failure just means no prompt.
 */
export function useAppReviewPrompt() {
  /** @param {{ businessId?: string | null }} params */
  const maybeRequestAppReview = useCallback(async ({ businessId } = {}) => {
    try {
      const normalizedBusinessId = businessId?.trim();
      if (!normalizedBusinessId) {
        return;
      }

      // Cheap local guard first so we skip the network call while in cooldown.
      const history = await readAppReviewPromptHistory();
      if (!shouldRequestAppReview({ completedBookingsCount: Infinity, history })) {
        return;
      }

      const { count, error } = await fetchCompletedBookingCountForBusiness(normalizedBusinessId);
      if (error || !shouldRequestAppReview({ completedBookingsCount: count, history })) {
        return;
      }

      if (!(await StoreReview.hasAction())) {
        return;
      }

      // Let success sheets/overlays finish dismissing before the native dialog appears.
      await new Promise((resolve) => setTimeout(resolve, APP_REVIEW_PROMPT_DELAY_MS));

      await recordAppReviewPromptAttempt();
      await StoreReview.requestReview();
    } catch {
      /* never block the calling flow */
    }
  }, []);

  return { maybeRequestAppReview };
}
