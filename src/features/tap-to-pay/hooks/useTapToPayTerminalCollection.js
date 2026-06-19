import { useCallback, useRef } from 'react';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
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
      return;
    }
    const { error } = await initialize();
    if (error) {
      throw new Error(
        mapTerminalErrorMessage(error.code, error.message || 'Could not start Tap to Pay.'),
      );
    }
    initializedRef.current = true;
  }, [initialize]);

  const resolveLocationId = useCallback(
    async (connectParams) => {
      const fromIntent = connectParams?.terminalLocationId?.trim();
      if (fromIntent) {
        return fromIntent;
      }

      const { locations, error } = await getLocations({ limit: 1 });
      if (error) {
        throw new Error(
          mapTerminalErrorMessage(
            error.code,
            error.message || 'Set up Stripe payments to use Tap to Pay.',
          ),
        );
      }

      const firstLocationId = locations?.[0]?.id?.trim();
      if (!firstLocationId) {
        throw new Error('Set up Stripe payments to use Tap to Pay.');
      }
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

      const { error } = await easyConnect(easyConnectParams);
      if (error) {
        throw new Error(
          mapTerminalErrorMessage(error.code, error.message || 'Could not connect to Tap to Pay.'),
        );
      }
    },
    [easyConnect, resolveLocationId],
  );

  const collectPayment = useCallback(
    async ({ clientSecret, paymentIntentId, amountCents, connectParams, merchantDisplayName }) => {
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
        throw new Error(
          mapTerminalErrorMessage(
            supportError.code,
            supportError.message || 'This device does not support Tap to Pay.',
          ),
        );
      }
      if (!readerSupportResult) {
        throw new Error('This device does not support Tap to Pay.');
      }

      await ensureTapToPayConnected(connectParams, merchantDisplayName);

      const { paymentIntent: retrievedIntent, error: retrieveError } = await retrievePaymentIntent(
        clientSecret.trim(),
      );
      if (retrieveError || !retrievedIntent) {
        throw new Error(
          mapTerminalErrorMessage(
            retrieveError?.code,
            retrieveError?.message || 'Couldn’t start Tap to Pay. Try again or mark as paid.',
          ),
        );
      }

      const { paymentIntent: processedIntent, error: processError } = await processPaymentIntent({
        paymentIntent: retrievedIntent,
        skipTipping: true,
      });
      if (processError || !processedIntent) {
        throw new Error(
          mapTerminalErrorMessage(
            processError?.code,
            processError?.message || 'Payment failed. Try again or mark as paid.',
          ),
        );
      }

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
