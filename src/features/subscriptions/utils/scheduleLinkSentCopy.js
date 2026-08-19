/**
 * Owner toast after sending a membership schedule link.
 *
 * @param {{ emailed?: boolean; smsed?: boolean }} result
 * @returns {string}
 */
export function getScheduleLinkSentToastMessage({ emailed = false, smsed = false }) {
  if (emailed && smsed) return 'Schedule link sent via email + text';
  if (smsed) return 'Schedule link sent via text';
  if (emailed) return 'Schedule link sent via email';
  return 'Schedule link sent';
}
