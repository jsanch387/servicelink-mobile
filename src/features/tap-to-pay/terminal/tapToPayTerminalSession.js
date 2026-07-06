/**
 * Shared Terminal session state for Tap to Pay warm-up and collection.
 * Module-level so app-level warm-up and the payment sheet reuse the same reader connection.
 */

/** @type {{
 *   initialized: boolean;
 *   lastInitStripeAccountId: string | null;
 *   lastConnectKey: string | null;
 *   readerWarm: boolean;
 * }} */
export const tapToPayTerminalSession = {
  initialized: false,
  lastInitStripeAccountId: null,
  lastConnectKey: null,
  readerWarm: false,
};

export function isTapToPayReaderWarm() {
  return (
    tapToPayTerminalSession.readerWarm &&
    tapToPayTerminalSession.initialized &&
    Boolean(tapToPayTerminalSession.lastConnectKey)
  );
}

/** Dev diagnostics — session flags used for in-memory “enabled” detection. */
export function getTapToPayTerminalSessionSnapshot() {
  return {
    initialized: tapToPayTerminalSession.initialized,
    readerWarm: tapToPayTerminalSession.readerWarm,
    hasConnectKey: Boolean(tapToPayTerminalSession.lastConnectKey),
    lastConnectKey: tapToPayTerminalSession.lastConnectKey,
    lastInitStripeAccountId: tapToPayTerminalSession.lastInitStripeAccountId,
    isReaderWarm: isTapToPayReaderWarm(),
  };
}

/**
 * @param {string | null | undefined} stripeAccountId
 */
export function markTapToPayInitialized(stripeAccountId) {
  tapToPayTerminalSession.initialized = true;
  tapToPayTerminalSession.lastInitStripeAccountId = stripeAccountId?.trim() || '';
}

/**
 * @param {string} connectKey
 */
export function markTapToPayConnected(connectKey) {
  tapToPayTerminalSession.lastConnectKey = connectKey;
  tapToPayTerminalSession.readerWarm = true;
}

export function clearTapToPayConnected() {
  tapToPayTerminalSession.lastConnectKey = null;
  tapToPayTerminalSession.readerWarm = false;
}

export function resetTapToPayTerminalSession() {
  tapToPayTerminalSession.initialized = false;
  tapToPayTerminalSession.lastInitStripeAccountId = null;
  tapToPayTerminalSession.lastConnectKey = null;
  tapToPayTerminalSession.readerWarm = false;
}
