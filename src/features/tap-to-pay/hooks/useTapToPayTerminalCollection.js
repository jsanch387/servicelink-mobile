import { useCallback, useRef } from 'react';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { TAP_TO_PAY_TERMINAL_NOT_CONFIGURED } from '../constants/tapToPayCopy';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { requestTapToPayAndroidPermissions } from '../utils/requestTapToPayAndroidPermissions';

/** @typedef {import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams} TapToPayConnectParams */

const DEFAULT_MERCHANT_NAME = 'ServiceLink';

/**
 * @param {string | null | undefined} code
 * @returns {string}
 */
function mapTerminalErrorMessage(code, fallback) {
  if (code === 'TAP_TO_PAY_UNSUPPORTED_DEVICE') {
    return 'This device does not support Tap to Pay.';
  }
  if (code === 'UNSUPPORTED_OPERATION') {
    return 'This app build is missing Tap to Pay on iPhone. Install a new development build with the Tap to Pay entitlement enabled.';
  }
  if (code === 'USER_ERROR.CANCELED' || code === 'Canceled') {
    return 'Payment was canceled.';
  }
  return fallback;
}

/**
 * Stripe Terminal Tap to Pay collection (iOS + Android).
 */
export function useTapToPayTerminalCollection() {
  const {
    initialize,
    supportsReadersOfType,
    easyConnect,
    getLocations,
    retrievePaymentIntent,
    processPaymentIntent,
  } = useStripeTerminal();

  const initializedRef = useRef(false);

  const ensureInitialized = useCallback(async () => {
    if (initializedRef.current) {
      logTapToPayDebug('terminal.init.skip', { reason: 'already_initialized' });
      return;
    }
    logTapToPayDebug('terminal.init.start');
    const { error } = await initialize();
    if (error) {
      logTapToPayFailure('terminal.init', {
        message: error.message,
        code: error.code,
      });
      throw new Error(
        mapTerminalErrorMessage(error.code, error.message || 'Could not start Tap to Pay.'),
      );
    }
    initializedRef.current = true;
    logTapToPayDebug('terminal.init.ok');
  }, [initialize]);

  const resolveLocationId = useCallback(
    async (connectParams) => {
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
          mapTerminalErrorMessage(
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
    },
    [getLocations],
  );

  const ensureTapToPayConnected = useCallback(
    async (connectParams, merchantDisplayName) => {
      const locationId = await resolveLocationId(connectParams);
      const displayName =
        merchantDisplayName?.trim() ||
        connectParams?.merchantDisplayName?.trim() ||
        DEFAULT_MERCHANT_NAME;

      /** @type {import('@stripe/stripe-terminal-react-native').EasyConnectTapToPayParams} */
      const easyConnectParams = {
        discoveryMethod: 'tapToPay',
        simulated: false,
        locationId,
        merchantDisplayName: displayName,
        tosAcceptancePermitted: true,
        autoReconnectOnUnexpectedDisconnect: true,
      };

      const stripeAccountId = connectParams?.stripeAccountId?.trim();
      if (stripeAccountId) {
        easyConnectParams.onBehalfOf = stripeAccountId;
      }

      logTapToPayDebug('terminal.connect.start', {
        locationId: maskId(locationId),
        merchantDisplayName: displayName,
        onBehalfOf: maskId(stripeAccountId),
      });

      const { error } = await easyConnect(easyConnectParams);
      if (error) {
        logTapToPayFailure('terminal.connect', {
          message: error.message,
          code: error.code,
          locationId: maskId(locationId),
        });
        throw new Error(
          mapTerminalErrorMessage(error.code, error.message || 'Could not connect to Tap to Pay.'),
        );
      }
      logTapToPayDebug('terminal.connect.ok', { locationId: maskId(locationId) });
    },
    [easyConnect, resolveLocationId],
  );

  const collectPayment = useCallback(
    async ({ clientSecret, paymentIntentId, amountCents, connectParams, merchantDisplayName }) => {
      logTapToPayDebug('terminal.collect.start', {
        paymentIntentId: maskId(paymentIntentId),
        amountCents,
        terminalLocationId: maskId(connectParams?.terminalLocationId),
        stripeAccountId: maskId(connectParams?.stripeAccountId),
      });

      if (!clientSecret?.trim()) {
        throw new Error('Couldn’t start Tap to Pay. Try again or mark as paid.');
      }

      const androidReady = await requestTapToPayAndroidPermissions();
      if (!androidReady) {
        throw new Error('Location access is required for Tap to Pay on Android.');
      }

      await ensureInitialized();

      const { readerSupportResult, error: supportError } = await supportsReadersOfType({
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
          mapTerminalErrorMessage(
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

      await ensureTapToPayConnected(connectParams, merchantDisplayName);

      logTapToPayDebug('terminal.retrieve.start', { paymentIntentId: maskId(paymentIntentId) });
      const { paymentIntent: retrievedIntent, error: retrieveError } = await retrievePaymentIntent(
        clientSecret.trim(),
      );
      if (retrieveError || !retrievedIntent) {
        logTapToPayFailure('terminal.retrieve', {
          message: retrieveError?.message,
          code: retrieveError?.code,
        });
        throw new Error(
          mapTerminalErrorMessage(
            retrieveError?.code,
            retrieveError?.message || 'Couldn’t start Tap to Pay. Try again or mark as paid.',
          ),
        );
      }
      logTapToPayDebug('terminal.retrieve.ok', {
        paymentIntentId: maskId(retrievedIntent.id),
        status: retrievedIntent.status,
        amount: retrievedIntent.amount,
      });

      logTapToPayDebug('terminal.process.start', {
        paymentIntentId: maskId(retrievedIntent.id),
        status: retrievedIntent.status,
      });
      const { paymentIntent: processedIntent, error: processError } = await processPaymentIntent({
        paymentIntent: retrievedIntent,
        skipTipping: true,
      });
      if (processError || !processedIntent) {
        logTapToPayFailure('terminal.process', {
          message: processError?.message,
          code: processError?.code,
        });
        throw new Error(
          mapTerminalErrorMessage(
            processError?.code,
            processError?.message || 'Payment failed. Try again or mark as paid.',
          ),
        );
      }
      logTapToPayDebug('terminal.process.done', {
        paymentIntentId: maskId(processedIntent.id),
        status: processedIntent.status,
        amount: processedIntent.amount,
      });

      if (processedIntent.status !== 'succeeded') {
        throw new Error('Payment has not completed yet.');
      }

      const resolvedId = processedIntent.id?.trim() || paymentIntentId?.trim();
      if (!resolvedId) {
        throw new Error('Payment could not be verified.');
      }

      if (paymentIntentId?.trim() && resolvedId !== paymentIntentId.trim()) {
        throw new Error('Payment could not be verified.');
      }

      const processedAmount = Math.max(0, Math.round(Number(processedIntent.amount) || 0));
      if (processedAmount > 0 && processedAmount !== amountCents) {
        throw new Error('Payment amount does not match.');
      }

      logTapToPayDebug('terminal.collect.ok', {
        paymentIntentId: maskId(resolvedId),
        amountCents: processedAmount > 0 ? processedAmount : amountCents,
      });

      return {
        paymentIntentId: resolvedId,
        amountCents: processedAmount > 0 ? processedAmount : amountCents,
      };
    },
    [
      ensureInitialized,
      ensureTapToPayConnected,
      processPaymentIntent,
      retrievePaymentIntent,
      supportsReadersOfType,
    ],
  );

  return { collectPayment };
}
