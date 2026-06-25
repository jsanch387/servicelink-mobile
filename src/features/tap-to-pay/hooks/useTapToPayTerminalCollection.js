import { useCallback } from 'react';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { TAP_TO_PAY_USE_TERMINAL_SDK } from '../constants/tapToPayFeatureFlags';
import { logTapToPayDebug, logTapToPayFailure, maskId } from '../utils/logTapToPayDebug';
import { markTapToPayMerchantEnabled } from '../utils/tapToPayEnablementStorage';
import { requestTapToPayAndroidPermissions } from '../utils/requestTapToPayAndroidPermissions';
import {
  ensureTapToPayReaderConnected,
  ensureTapToPayTerminalInitialized,
  mapTapToPayTerminalErrorMessage,
  prewarmTapToPayReaderSession,
} from '../terminal/tapToPayTerminalConnect';
import { runTapToPayTerminalPayment } from '../terminal/runTapToPayTerminalPayment';

/** @typedef {import('../utils/parseTapToPayIntentConnectParams').TapToPayConnectParams} TapToPayConnectParams */

/**
 * Stripe Terminal Tap to Pay collection (iOS + Android).
 * Reuses module-level session state warmed on app launch when possible.
 */
export function useTapToPayTerminalCollection() {
  const {
    initialize,
    supportsReadersOfType,
    easyConnect,
    disconnectReader,
    clearCachedCredentials,
    getLocations,
    retrievePaymentIntent,
    collectPaymentMethod,
    confirmPaymentIntent,
  } = useStripeTerminal();

  const collectPayment = useCallback(
    async ({
      clientSecret,
      paymentIntentId,
      amountCents,
      connectParams,
      merchantDisplayName,
      onProcessingStart,
    }) => {
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

      const stripeAccountId = connectParams?.stripeAccountId?.trim() ?? null;

      await ensureTapToPayTerminalInitialized({
        initialize,
        disconnectReader,
        clearCachedCredentials,
        stripeAccountId,
        reason: 'collect',
      });

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
        easyConnect,
        disconnectReader,
        getLocations,
        connectParams,
        merchantDisplayName,
        reason: 'collect',
      });

      await markTapToPayMerchantEnabled(
        connectParams?.stripeAccountId,
        connectParams?.terminalLocationId,
      );

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
          mapTapToPayTerminalErrorMessage(
            retrieveError?.code,
            retrieveError?.message || 'Couldn’t start Tap to Pay. Try again or mark as paid.',
          ),
        );
      }
      logTapToPayDebug('terminal.retrieve.ok', {
        paymentIntentId: maskId(retrievedIntent.id),
        status: retrievedIntent.status,
        amount: retrievedIntent.amount,
        onBehalfOf: maskId(retrievedIntent.onBehalfOf),
      });

      const processedIntent = await runTapToPayTerminalPayment({
        paymentIntent: retrievedIntent,
        collectPaymentMethod,
        confirmPaymentIntent,
        onProcessingStart,
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
      clearCachedCredentials,
      collectPaymentMethod,
      confirmPaymentIntent,
      disconnectReader,
      easyConnect,
      getLocations,
      initialize,
      retrievePaymentIntent,
      supportsReadersOfType,
    ],
  );

  const prewarmReaderForCollect = useCallback(
    async ({ connectParams, merchantDisplayName: displayName, reason = 'collect_prewarm' }) => {
      if (!TAP_TO_PAY_USE_TERMINAL_SDK) {
        return;
      }
      await prewarmTapToPayReaderSession({
        initialize,
        supportsReadersOfType,
        easyConnect,
        disconnectReader,
        clearCachedCredentials,
        getLocations,
        connectParams,
        merchantDisplayName: displayName,
        reason,
      });
    },
    [
      clearCachedCredentials,
      disconnectReader,
      easyConnect,
      getLocations,
      initialize,
      supportsReadersOfType,
    ],
  );

  return { collectPayment, prewarmReaderForCollect };
}
