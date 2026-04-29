import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import { fetchStripeExpressDashboardUrl } from '../api/stripeExpressDashboard';
import { STRIPE_GENERIC_DASHBOARD_URL } from '../constants/stripeUrls';
import { paymentLayoutStyles, paymentTextStyles } from '../constants/paymentTypography';

/**
 * @param {{ stripeAccountId?: string | null }} props
 */
export function PaymentStripeDashboardCard({ stripeAccountId = null }) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [opening, setOpening] = useState(false);

  const hasExpressAccount =
    typeof stripeAccountId === 'string' && stripeAccountId.trim().startsWith('acct_');

  const openDashboard = useCallback(async () => {
    setOpening(true);
    try {
      if (hasExpressAccount) {
        const token = session?.access_token ?? null;
        const result = await fetchStripeExpressDashboardUrl(token);
        if ('url' in result) {
          try {
            await openBrowserAsync(result.url, {
              dismissButtonStyle: 'close',
              presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
            });
          } catch (e) {
            Alert.alert(
              'Could not open browser',
              safeUserFacingMessage(e, { fallback: 'Unknown error' }),
            );
          }
          return;
        }
        const baseMsg = result.error?.message ?? 'Something went wrong.';
        const safeApi = safeUserFacingMessage(baseMsg, { fallback: 'Something went wrong.' });
        const statusHint =
          result.httpStatus === 401
            ? '\n\nThis API still expects a web cookie session. Open Stripe from the web dashboard, or add Bearer JWT support on this route for mobile.'
            : '';
        Alert.alert('Could not open Stripe', `${safeApi}${statusHint}`, [
          {
            text: 'Open stripe.com',
            onPress: () => {
              void openBrowserAsync(STRIPE_GENERIC_DASHBOARD_URL);
            },
          },
          { text: 'OK', style: 'cancel' },
        ]);
        return;
      }

      try {
        await openBrowserAsync(STRIPE_GENERIC_DASHBOARD_URL, {
          dismissButtonStyle: 'close',
          presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
        });
      } catch (e) {
        Alert.alert(
          'Could not open browser',
          safeUserFacingMessage(e, { fallback: 'Unknown error' }),
        );
      }
    } finally {
      setOpening(false);
    }
  }, [hasExpressAccount, session?.access_token]);

  return (
    <SurfaceCard style={styles.card}>
      <View style={paymentLayoutStyles.headerTextGroup}>
        <AppText style={[paymentTextStyles.sectionTitle, { color: colors.text }]}>Stripe</AppText>
        <AppText style={[paymentTextStyles.sectionBody, { color: colors.textMuted }]}>
          View balance, charges, payouts, and tax forms in your Stripe dashboard. Bank and payout
          details are managed in Stripe.
        </AppText>
      </View>
      <Button
        disabled={opening}
        fullWidth
        iconName="open-outline"
        iconPosition="right"
        loading={opening}
        title="Open Stripe Dashboard"
        variant="secondary"
        onPress={() => {
          void openDashboard();
        }}
      />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
});
