/**
 * @param {number} httpStatus
 * @param {string | null} serverMessage
 * @param {'booking' | 'merchant'} [scope='booking']
 * @returns {string}
 */
export function mapTapToPayHttpError(httpStatus, serverMessage, scope = 'booking') {
  const fallback = serverMessage?.trim() || null;
  const merchant = scope === 'merchant';
  switch (httpStatus) {
    case 400:
      return fallback || (merchant ? 'Enter an amount greater than $0.' : 'Nothing to collect for this booking.');
    case 401:
      return fallback || 'Sign in again to collect payment.';
    case 404:
      if (merchant) {
        return fallback || 'Business profile not found';
      }
      return fallback || 'Appointment not found.';
    case 409:
      return fallback || 'Mark work done before collecting payment.';
    case 422:
      return fallback || 'Set up Stripe payments to use Tap to Pay.';
    case 429:
      return (
        fallback ||
        (merchant
          ? 'Too many Tap to Pay requests. Please wait a moment and try again.'
          : 'You’re sending requests too quickly. Try again shortly.')
      );
    case 500:
      return fallback || (merchant ? 'Couldn’t start Tap to Pay. Try again.' : 'Couldn’t start Tap to Pay. Try again or mark as paid.');
    case 0:
      return fallback || 'Network error. Check your connection and try again.';
    default:
      return fallback || `Couldn’t start Tap to Pay (${httpStatus}).`;
  }
}
