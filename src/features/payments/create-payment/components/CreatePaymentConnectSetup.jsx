import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { CREATE_PAYMENT_PAGE_PAD_TOP } from '../constants';

/**
 * Pro owner without Stripe Connect — send them to Payments → Settings.
 */
export function CreatePaymentConnectSetup({ onSetupPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          paddingHorizontal: 16,
          paddingTop: CREATE_PAYMENT_PAGE_PAD_TOP,
        },
        card: {
          gap: 12,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          fontWeight: '600',
          letterSpacing: -0.45,
          lineHeight: 28,
        },
        body: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        cta: {
          marginTop: 6,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="create-payment-connect-setup">
      <SurfaceCard outlined padding="md" style={styles.card}>
        <AppText accessibilityRole="header" style={styles.title}>
          Set up payments
        </AppText>
        <AppText style={styles.body}>
          Connect Stripe to send a payment link or collect with Tap to Pay.
        </AppText>
        <View style={styles.cta}>
          <Button fullWidth title="Open Payments" variant="secondary" onPress={onSetupPress} />
        </View>
      </SurfaceCard>
    </View>
  );
}
