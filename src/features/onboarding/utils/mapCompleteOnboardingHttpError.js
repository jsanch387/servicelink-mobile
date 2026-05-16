/**
 * User-facing copy for `POST /api/onboarding-v2/complete` failures.
 *
 * @param {number} httpStatus
 * @param {string | null | undefined} serverMessage
 * @returns {string}
 */
export function mapCompleteOnboardingHttpError(httpStatus, serverMessage) {
  const fromServer = serverMessage?.trim() || null;

  if (httpStatus === 401) {
    return 'Your session expired. Please sign in again and try activating your link.';
  }
  if (httpStatus === 400) {
    return fromServer || 'We could not finish setup. Check your business profile and try again.';
  }
  if (httpStatus === 500) {
    return fromServer || 'Something went wrong on our side. Please try again in a moment.';
  }
  if (httpStatus === 0) {
    return fromServer || 'Could not reach the server. Check your connection and try again.';
  }
  if (httpStatus === 404) {
    return fromServer || 'Setup service is unavailable. Please try again later.';
  }

  return fromServer || 'Could not activate your link. Please try again.';
}
