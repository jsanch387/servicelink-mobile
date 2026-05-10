import { openNotificationTarget } from './openNotificationTarget';

/**
 * Maps Expo push `data` (same keys you send from the server) to in-app navigation.
 * @param {*} navigation
 * @param {Record<string, unknown> | null | undefined} data
 */
export function navigateFromPushPayload(navigation, data) {
  if (!data || typeof data !== 'object') {
    return;
  }
  const referenceType = String(data.reference_type ?? data.referenceType ?? '').trim();
  const referenceId = String(data.reference_id ?? data.referenceId ?? '').trim();
  openNotificationTarget(navigation, {
    referenceType,
    referenceId,
  });
}
