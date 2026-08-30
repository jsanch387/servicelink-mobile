import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import { fetchStripeExpressDashboardUrl } from '../api/stripeExpressDashboard';
import {
  STRIPE_CARD_RATE_LABEL,
  STRIPE_GENERIC_DASHBOARD_URL,
  STRIPE_TAP_TO_PAY_RATE_LABEL,
} from '../constants/stripeUrls';
import { paymentLayoutStyles, paymentTextStyles } from '../constants/paymentTypography';

/**
 * @param {{ stripeAccountId?: string | null }} props
 */
export function PaymentStripeDashboardCard({ stripeAccountId = null }) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const [opening, setOpening] = useState(false);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          gap: 14,
        },
        fees: {
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          gap: 8,
          paddingTop: 12,
        },
        feesTitle: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        feeRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        feeLabelCol: {
          flex: 1,
          minWidth: 0,
        },
        feeLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
        },
        feeRateCol: {
          justifyContent: 'center',
        },
        feeRate: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
        },
      }),
    [colors],
  );

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
          result.httpStatus === 404
            ? '\n\nNo Stripe account is linked for this business yet.'
            : result.httpStatus === 401
              ? '\n\nPlease sign in again and try once more, or open Stripe in your browser.'
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
      <View style={styles.fees}>
        <AppText style={styles.feesTitle}>Stripe charges</AppText>
        <View style={styles.feeRow}>
          <View style={styles.feeLabelCol}>
            <AppText style={styles.feeLabel}>Cards</AppText>
          </View>
          <View style={styles.feeRateCol}>
            <AppText style={styles.feeRate}>{STRIPE_CARD_RATE_LABEL}</AppText>
          </View>
        </View>
        <View style={styles.feeRow}>
          <View style={styles.feeLabelCol}>
            <AppText style={styles.feeLabel}>Tap to pay</AppText>
          </View>
          <View style={styles.feeRateCol}>
            <AppText style={styles.feeRate}>{STRIPE_TAP_TO_PAY_RATE_LABEL}</AppText>
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}
