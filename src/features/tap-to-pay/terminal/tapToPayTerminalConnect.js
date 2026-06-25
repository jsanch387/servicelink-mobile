import {
  isTapToPayAppleLinkTerminalError,
  isTapToPayCanceledTerminalError,
  isTapToPayTimeoutTerminalError,
  TAP_TO_PAY_MERCHANT_LIMIT,
  TAP_TO_PAY_PAYMENT_CANCELED,
  TAP_TO_PAY_PAYMENT_TIMED_OUT,
  TAP_TO_PAY_SETUP_NOT_FINISHED,
  TAP_TO_PAY_TERMINAL_NOT_CONFIGURED,
} from '../constants/tapToPayCopy';
import { mapTapToPayOsVersionTerminalError } from '../utils/tapToPayOsVersionError';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { requestTapToPayAndroidPermissions } from '../utils/requestTapToPayAndroidPermissions';
import { maybePresentTapToPayEducationAfterConnect } from '../education/maybePresentTapToPayEducationAfterConnect';
import {
  clearTapToPayConnected,
  isTapToPayReaderWarm,
  markTapToPayConnected,
  markTapToPayInitialized,
  resetTapToPayTerminalSession,
  tapToPayTerminalSession,
} from './tapToPayTerminalSession';

/** @typedef {import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams} TapToPayConnectParams */

const DEFAULT_MERCHANT_NAME = 'ServiceLink';

/**
 * @param {string | null | undefined} code
 * @returns {string}
 */
export function mapTapToPayTerminalErrorMessage(code, fallback) {
  const osVersionMessage = mapTapToPayOsVersionTerminalError(code, fallback);
  if (osVersionMessage) {
    return osVersionMessage;
  }

  if (code === 'TAP_TO_PAY_UNSUPPORTED_DEVICE') {
    return 'This device does not support Tap to Pay.';
  }
  if (code === 'UNSUPPORTED_OPERATION') {
    return 'This app build is missing Tap to Pay on iPhone. Install a new development build with the Tap to Pay entitlement enabled.';
  }
  if (isTapToPayCanceledTerminalError(code, fallback)) {
    return TAP_TO_PAY_PAYMENT_CANCELED;
  }
  if (isTapToPayTimeoutTerminalError(code, fallback)) {
    return TAP_TO_PAY_PAYMENT_TIMED_OUT;
  }
  if (code === 'READER_MERCHANT_BLOCKED') {
    return TAP_TO_PAY_MERCHANT_LIMIT;
  }
  if (isTapToPayAppleLinkTerminalError(code, fallback)) {
    return TAP_TO_PAY_SETUP_NOT_FINISHED;
  }
  if (code === 'READER_SOFTWARE_UPDATE_FAILED') {
    return TAP_TO_PAY_SETUP_NOT_FINISHED;
  }
  if (
    code === 'INVALID_REQUIRED_PARAMETER' &&
    typeof fallback === 'string' &&
    fallback.includes('on_behalf_of')
  ) {
    return 'Tap to Pay could not connect to this merchant’s Stripe account. Try again or mark as paid.';
  }
  return fallback;
}

/**
 * @param {{
 *   initialize: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   disconnectReader: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   clearCachedCredentials: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   stripeAccountId: string | null;
 *   reason: string;
 * }} params
 */
export async function ensureTapToPayTerminalInitialized({
  initialize,
  disconnectReader,
  clearCachedCredentials,
  stripeAccountId,
  reason,
}) {
  const accountKey = stripeAccountId?.trim() || '';
  const needsReinit =
    tapToPayTerminalSession.initialized &&
    tapToPayTerminalSession.lastInitStripeAccountId !== accountKey;

  if (needsReinit) {
    await resetTapToPayTerminalSessionState({
      disconnectReader,
      clearCachedCredentials,
      reason: `${reason}:stripe_account_changed`,
    });
  }

  if (tapToPayTerminalSession.initialized) {
    logTapToPayDebug('terminal.init.skip', {
      reason: 'already_initialized',
      stripeAccountId: maskId(accountKey),
    });
    return;
  }

  logTapToPayDebug('terminal.init.start', { stripeAccountId: maskId(accountKey), reason });
  const { error } = await initialize();
  if (error) {
    logTapToPayFailure('terminal.init', {
      message: error.message,
      code: error.code,
    });
    throw new Error(
      mapTapToPayTerminalErrorMessage(error.code, error.message || 'Could not start Tap to Pay.'),
    );
  }
  markTapToPayInitialized(accountKey);
  logTapToPayDebug('terminal.init.ok', { stripeAccountId: maskId(accountKey), reason });
}

/**
 * @param {{
 *   disconnectReader: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   clearCachedCredentials: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   reason: string;
 * }} params
 */
export async function resetTapToPayTerminalSessionState({
  disconnectReader,
  clearCachedCredentials,
  reason,
}) {
  logTapToPayDebug('terminal.reset.start', { reason });
  if (tapToPayTerminalSession.initialized) {
    const disconnectResult = await disconnectReader();
    if (disconnectResult?.error) {
      logTapToPayDebug('terminal.reset.disconnect_skip', {
        message: disconnectResult.error.message,
        code: disconnectResult.error.code,
      });
    }
    const clearResult = await clearCachedCredentials();
    if (clearResult?.error) {
      logTapToPayFailure('terminal.reset', {
        message: clearResult.error.message,
        code: clearResult.error.code,
      });
    }
  } else {
    logTapToPayDebug('terminal.reset.skip', { reason: 'not_initialized_yet' });
  }
  resetTapToPayTerminalSession();
  logTapToPayDebug('terminal.reset.ok', { reason });
}

/**
 * @param {{
 *   getLocations: (params: { limit: number }) => Promise<{
 *     locations?: Array<{ id?: string }>;
 *     error?: { message?: string; code?: string };
 *   }>;
 *   connectParams: TapToPayConnectParams | null | undefined;
 * }} params
 */
export async function resolveTapToPayLocationId({ getLocations, connectParams }) {
  const fromIntent = connectParams?.terminalLocationId?.trim();
  if (fromIntent) {
    logTapToPayDebug('terminal.location', { source: 'intent', locationId: maskId(fromIntent) });
    return fromIntent;
  }

  logTapToPayDebug('terminal.locations.fetch');
  const { locations, error } = await getLocations({ limit: 1 });
  if (error) {
    logTapToPayFailure('terminal.locations', {
      message: error.message,
      code: error.code,
    });
    throw new Error(
      mapTapToPayTerminalErrorMessage(
        error.code,
        error.message || 'Set up Stripe payments to use Tap to Pay.',
      ),
    );
  }

  const firstLocationId = locations?.[0]?.id?.trim();
  if (!firstLocationId) {
    logTapToPayFailure('terminal.locations', {
      message: TAP_TO_PAY_TERMINAL_NOT_CONFIGURED,
      count: locations?.length ?? 0,
    });
    throw new Error(TAP_TO_PAY_TERMINAL_NOT_CONFIGURED);
  }
  logTapToPayDebug('terminal.location', {
    source: 'stripe',
    locationId: maskId(firstLocationId),
    count: locations?.length ?? 0,
  });
  return firstLocationId;
}

/**
 * @param {{
 *   easyConnect: (params: import('@stripe/stripe-terminal-react-native').EasyConnectTapToPayParams) => Promise<{
 *     error?: { message?: string; code?: string };
 *   }>;
 *   disconnectReader: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   getLocations: (params: { limit: number }) => Promise<{
 *     locations?: Array<{ id?: string }>;
 *     error?: { message?: string; code?: string };
 *   }>;
 *   connectParams: TapToPayConnectParams | null | undefined;
 *   merchantDisplayName?: string | null;
 *   reason: string;
 * }} params
 */
export async function ensureTapToPayReaderConnected({
  easyConnect,
  disconnectReader,
  getLocations,
  connectParams,
  merchantDisplayName,
  reason,
}) {
  const locationId = await resolveTapToPayLocationId({ getLocations, connectParams });
  const displayName =
    merchantDisplayName?.trim() ||
    connectParams?.merchantDisplayName?.trim() ||
    DEFAULT_MERCHANT_NAME;

  const stripeAccountId = connectParams?.stripeAccountId?.trim() ?? null;
  const connectKey = `${locationId}|${stripeAccountId ?? ''}`;

  if (tapToPayTerminalSession.lastConnectKey === connectKey) {
    logTapToPayDebug('terminal.connect.skip', {
      locationId: maskId(locationId),
      reason,
    });
    return { locationId, connectKey };
  }

  if (tapToPayTerminalSession.lastConnectKey) {
    logTapToPayDebug('terminal.disconnect.start', {
      reason: `${reason}:connect_params_changed`,
    });
    const { error: disconnectError } = await disconnectReader();
    if (disconnectError) {
      logTapToPayDebug('terminal.disconnect.skip', {
        message: disconnectError.message,
        code: disconnectError.code,
      });
    } else {
      logTapToPayDebug('terminal.disconnect.ok');
    }
    clearTapToPayConnected();
  }

  /** @type {import('@stripe/stripe-terminal-react-native').EasyConnectTapToPayParams} */
  const easyConnectParams = {
    discoveryMethod: 'tapToPay',
    simulated: false,
    locationId,
    merchantDisplayName: displayName,
    tosAcceptancePermitted: true,
    autoReconnectOnUnexpectedDisconnect: true,
  };

  logTapToPayDebug('terminal.connect.start', {
    locationId: maskId(locationId),
    merchantDisplayName: displayName,
    stripeAccountId: maskId(stripeAccountId),
    chargeModel: 'connect_direct',
    reason,
  });

  const { error } = await easyConnect(easyConnectParams);
  if (error) {
    clearTapToPayConnected();
    logTapToPayFailure('terminal.connect', {
      message: error.message,
      code: error.code,
      locationId: maskId(locationId),
    });
    throw new Error(
      mapTapToPayTerminalErrorMessage(
        error.code,
        error.message || 'Could not connect to Tap to Pay.',
      ),
    );
  }

  markTapToPayConnected(connectKey);
  logTapToPayDebug('terminal.connect.ok', {
    locationId: maskId(locationId),
    stripeAccountId: maskId(stripeAccountId),
    chargeModel: 'connect_direct',
    reason,
  });

  await maybePresentTapToPayEducationAfterConnect();

  return { locationId, connectKey };
}

/**
 * Initialize Terminal SDK and verify device support — no reader connect, no Apple T&C.
 *
 * @param {{
 *   initialize: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   disconnectReader: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   clearCachedCredentials: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   supportsReadersOfType: (params: {
 *     deviceType: string;
 *     simulated: boolean;
 *     discoveryMethod: string;
 *   }) => Promise<{
 *     readerSupportResult?: boolean;
 *     error?: { message?: string; code?: string };
 *   }>;
 *   connectParams: TapToPayConnectParams | null | undefined;
 *   reason: string;
 * }} terminal
 */
export async function prepareTapToPayTerminal(terminal) {
  logTapToPayDebug('terminal.prepare.start', {
    reason: terminal.reason,
    terminalLocationId: maskId(terminal.connectParams?.terminalLocationId),
    stripeAccountId: maskId(terminal.connectParams?.stripeAccountId),
  });

  const androidReady = await requestTapToPayAndroidPermissions();
  if (!androidReady) {
    throw new Error('Location access is required for Tap to Pay on Android.');
  }

  const stripeAccountId = terminal.connectParams?.stripeAccountId?.trim() ?? null;

  await ensureTapToPayTerminalInitialized({
    initialize: terminal.initialize,
    disconnectReader: terminal.disconnectReader,
    clearCachedCredentials: terminal.clearCachedCredentials,
    stripeAccountId,
    reason: terminal.reason,
  });

  const { readerSupportResult, error: supportError } = await terminal.supportsReadersOfType({
    deviceType: 'tapToPay',
    simulated: false,
    discoveryMethod: 'tapToPay',
  });
  if (supportError) {
    logTapToPayFailure('terminal.support', {
      message: supportError.message,
      code: supportError.code,
    });
    throw new Error(
      mapTapToPayTerminalErrorMessage(
        supportError.code,
        supportError.message || 'This device does not support Tap to Pay.',
      ),
    );
  }
  if (!readerSupportResult) {
    logTapToPayFailure('terminal.support', { message: 'Device does not support Tap to Pay' });
    throw new Error('This device does not support Tap to Pay.');
  }

  logTapToPayDebug('terminal.prepare.ok', {
    reason: terminal.reason,
    stripeAccountId: maskId(stripeAccountId),
  });
}

/** @type {Promise<unknown> | null} */
let tapToPayReaderConnectInFlight = null;

/**
 * Connect the Tap to Pay reader when cold. Dedupes concurrent callers (warmup, Complete prewarm, collect).
 * Safe after merchant opt-in — Apple T&C already accepted on Enable; no UI from this module.
 *
 * @param {Parameters<typeof ensureTapToPayReaderConnected>[0]} params
 */
export async function connectTapToPayReaderIfNeeded(params) {
  if (isTapToPayReaderWarm()) {
    logTapToPayDebug('terminal.connect.skip', {
      reason: `${params.reason}:reader_warm`,
    });
    return null;
  }

  if (tapToPayReaderConnectInFlight) {
    logTapToPayDebug('terminal.connect.await', { reason: params.reason });
    return tapToPayReaderConnectInFlight;
  }

  tapToPayReaderConnectInFlight = ensureTapToPayReaderConnected(params).finally(() => {
    tapToPayReaderConnectInFlight = null;
  });
  return tapToPayReaderConnectInFlight;
}

/**
 * Prepare SDK + connect reader for opted-in merchants (app warm-up, Complete prewarm, parallel collect).
 *
 * @param {Parameters<typeof warmTapToPayReader>[0]} terminal
 */
export async function prewarmTapToPayReaderSession(terminal) {
  const reason = terminal.reason ?? 'prewarm';

  await prepareTapToPayTerminal({
    initialize: terminal.initialize,
    disconnectReader: terminal.disconnectReader,
    clearCachedCredentials: terminal.clearCachedCredentials,
    supportsReadersOfType: terminal.supportsReadersOfType,
    connectParams: terminal.connectParams,
    reason,
  });

  await connectTapToPayReaderIfNeeded({
    easyConnect: terminal.easyConnect,
    disconnectReader: terminal.disconnectReader,
    getLocations: terminal.getLocations,
    connectParams: terminal.connectParams,
    merchantDisplayName: terminal.merchantDisplayName,
    reason,
  });

  logTapToPayDebug('prewarm.ok', {
    reason,
    readerWarm: isTapToPayReaderWarm(),
    terminalLocationId: maskId(terminal.connectParams?.terminalLocationId),
    stripeAccountId: maskId(terminal.connectParams?.stripeAccountId),
  });
}

/** @internal — clears dedupe latch between Jest cases. */
export function resetTapToPayReaderConnectInFlightForTests() {
  tapToPayReaderConnectInFlight = null;
}

/**
 * Full connect flow for explicit user actions (Enable, Reconnect, Collect).
 * May present Apple T&C when the merchant account is not yet linked on this iPhone.
 *
 * @param {{
 *   initialize: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   supportsReadersOfType: (params: {
 *     deviceType: string;
 *     simulated: boolean;
 *     discoveryMethod: string;
 *   }) => Promise<{
 *     readerSupportResult?: boolean;
 *     error?: { message?: string; code?: string };
 *   }>;
 *   easyConnect: (params: import('@stripe/stripe-terminal-react-native').EasyConnectTapToPayParams) => Promise<{
 *     error?: { message?: string; code?: string };
 *   }>;
 *   disconnectReader: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   clearCachedCredentials: () => Promise<{ error?: { message?: string; code?: string } }>;
 *   getLocations: (params: { limit: number }) => Promise<{
 *     locations?: Array<{ id?: string }>;
 *     error?: { message?: string; code?: string };
 *   }>;
 *   connectParams: TapToPayConnectParams | null | undefined;
 *   merchantDisplayName?: string | null;
 *   reason?: string;
 * }} terminal
 */
export async function warmTapToPayReader(terminal) {
  const reason = terminal.reason ?? 'connect';

  logTapToPayDebug('connect.flow.start', {
    reason,
    terminalLocationId: maskId(terminal.connectParams?.terminalLocationId),
    stripeAccountId: maskId(terminal.connectParams?.stripeAccountId),
  });

  await prepareTapToPayTerminal({
    initialize: terminal.initialize,
    disconnectReader: terminal.disconnectReader,
    clearCachedCredentials: terminal.clearCachedCredentials,
    supportsReadersOfType: terminal.supportsReadersOfType,
    connectParams: terminal.connectParams,
    reason,
  });

  await ensureTapToPayReaderConnected({
    easyConnect: terminal.easyConnect,
    disconnectReader: terminal.disconnectReader,
    getLocations: terminal.getLocations,
    connectParams: terminal.connectParams,
    merchantDisplayName: terminal.merchantDisplayName,
    reason,
  });

  logTapToPayDebug('connect.flow.ok', {
    reason,
    terminalLocationId: maskId(terminal.connectParams?.terminalLocationId),
    stripeAccountId: maskId(terminal.connectParams?.stripeAccountId),
  });
}
