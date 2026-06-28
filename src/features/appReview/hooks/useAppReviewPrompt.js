import { useCallback } from 'react';
import { requestAppReviewAfterMarkComplete } from '../utils/requestAppReviewAfterMarkComplete';

/** @deprecated Prefer dynamic import of requestAppReviewAfterMarkComplete at call sites for OTA safety. */
export function useAppReviewPrompt() {
  const maybeRequestAppReview = useCallback(async ({ businessId } = {}) => {
    await requestAppReviewAfterMarkComplete({ businessId });
  }, []);

  return { maybeRequestAppReview };
}
