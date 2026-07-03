import { resolvePushDestination } from './resolvePushDestination';
import { navigateToPushDestination } from './navigateToPushDestination';

/**
 * @param {*} navigation React Navigation object with `navigate`.
 * @param {{ referenceType: string; referenceId: string }} item
 */
export function openNotificationTarget(navigation, item) {
  const destination = resolvePushDestination({
    referenceType: item.referenceType,
    referenceId: item.referenceId,
  });
  navigateToPushDestination(navigation, destination);
}
