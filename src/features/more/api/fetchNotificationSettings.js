/**
 * Loads notification preference toggles. Replace with API when available.
 * @returns {Promise<{
 *   newBookings: boolean;
 *   bookingChanges: boolean;
 *   paymentUpdates: boolean;
 *   marketingTips: boolean;
 * }>}
 */
export async function fetchNotificationSettings() {
  return {
    newBookings: true,
    bookingChanges: true,
    paymentUpdates: true,
    marketingTips: false,
  };
}
