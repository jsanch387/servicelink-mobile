import { getCompleteVisitSuccessDetail } from './completeVisitNotificationCopy';

/**
 * @returns {{ title: string; detail: string }}
 */
export function getCompleteVisitSuccessCopy() {
  return {
    title: 'Complete',
    detail: getCompleteVisitSuccessDetail(),
  };
}
