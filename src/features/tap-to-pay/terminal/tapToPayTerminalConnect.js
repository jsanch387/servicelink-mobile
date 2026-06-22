import { TAP_TO_PAY_TERMINAL_NOT_CONFIGURED } from '../constants/tapToPayCopy';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { requestTapToPayAndroidPermissions } from '../utils/requestTapToPayAndroidPermissions';
import { maybePresentTapToPayEducationAfterConnect } from '../education/maybePresentTapToPayEducationAfterConnect';
import {
  clearTapToPayConnected,
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
  if (code === 'TAP_TO_PAY_UNSUPPORTED_DEVICE') {
    return 'This device does not support Tap to Pay.';
  }
  if (code === 'UNSUPPORTED_OPERATION') {
    return 'This app build is missing Tap to Pay on iPhone. Install a new development build with the Tap to Pay entitlement enabled.';
  }
  if (code === 'USER_ERROR.CANCELED' || code === 'Canceled') {
    return 'Payment was canceled.';
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
 * }} terminal
 */
export async function warmTapToPayReader(terminal) {
  logTapToPayDebug('warmup.start', {
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
    reason: 'warmup',
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
  logTapToPayDebug('terminal.support.ok');

  await ensureTapToPayReaderConnected({
    easyConnect: terminal.easyConnect,
    disconnectReader: terminal.disconnectReader,
    getLocations: terminal.getLocations,
    connectParams: terminal.connectParams,
    merchantDisplayName: terminal.merchantDisplayName,
    reason: 'warmup',
  });

  logTapToPayDebug('warmup.ok', {
    terminalLocationId: maskId(terminal.connectParams?.terminalLocationId),
    stripeAccountId: maskId(stripeAccountId),
  });
}
