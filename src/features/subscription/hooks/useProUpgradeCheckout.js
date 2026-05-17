import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../auth';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { createPaywallUpgradeCheckoutSession } from '../api/createPaywallUpgradeCheckoutSession';
import { STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL } from '../constants/stripePaywallCheckoutReturnUrl';
import { navigateToAccountSettings } from '../navigation/navigateToAccountSettings';
import { useSubscription } from '../context/SubscriptionContext';
import { parsePaywallUpgradeReturnResult } from '../utils/parsePaywallUpgradeReturnUrl';
import { refetchAccountAfterUpgradeCheckout } from '../utils/refetchAccountAfterUpgradeCheckout';

/**
 * Opens Stripe Checkout for Pro upgrade and refreshes subscription state on return.
 */
export function useProUpgradeCheckout() {
  const { session, user } = useAuth();
  const { refetchSubscription } = useSubscription();
  const [submitting, setSubmitting] = useState(false);

  const startUpgradeCheckout = useCallback(async () => {
    const token = session?.access_token ?? null;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createPaywallUpgradeCheckoutSession(token);
      if ('error' in created) {
        Alert.alert(
          'Could not start checkout',
          safeUserFacingMessage(created.error, { fallback: 'Something went wrong. Try again.' }),
        );
        return;
      }

      let returnResult = null;
      try {
        const authResult = await WebBrowser.openAuthSessionAsync(
          created.url,
          STRIPE_PAYWALL_CHECKOUT_AUTH_RETURN_URL,
        );
        returnResult = parsePaywallUpgradeReturnResult(authResult);
      } catch (browserError) {
        await refetchSubscription();
        throw browserError;
      }

      if (returnResult === 'success') {
        await refetchAccountAfterUpgradeCheckout({ userId: user?.id ?? '' });
        navigateToAccountSettings();
        return;
      }

      await refetchSubscription();
    } catch (e) {
      Alert.alert(
        'Checkout',
        safeUserFacingMessage(e, { fallback: 'Something went wrong. Try again.' }),
      );
    } finally {
      setSubmitting(false);
    }
  }, [refetchSubscription, session?.access_token, user?.id]);

  return { startUpgradeCheckout, submitting };
}
