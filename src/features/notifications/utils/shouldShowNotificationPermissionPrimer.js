/**
 * Show the primer only when iOS/Android can still present the system dialog.
 * Skip on web, after the owner already chose, or when permission is already decided.
 *
 * @param {{
 *   platform?: string;
 *   permissionStatus?: string | null;
 *   hasSeenPrimer?: boolean;
 * }} input
 */
export function shouldShowNotificationPermissionPrimer({
  platform,
  permissionStatus,
  hasSeenPrimer,
} = {}) {
  if (platform === 'web') {
    return false;
  }
  if (hasSeenPrimer) {
    return false;
  }
  return permissionStatus === 'undetermined';
}
