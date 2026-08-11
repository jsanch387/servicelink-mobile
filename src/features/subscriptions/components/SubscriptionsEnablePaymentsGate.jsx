import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  SUBSCRIPTIONS_PAYMENTS_OFF_BODY,
  SUBSCRIPTIONS_PAYMENTS_OFF_CONNECTED,
  SUBSCRIPTIONS_PAYMENTS_OFF_CTA,
  SUBSCRIPTIONS_PAYMENTS_OFF_TITLE,
} from '../constants/setupCopy';

/**
 * Pro + Connect ready, but ServiceLink payments still off — same gate pattern as Payments.
 *
 * @param {object} props
 * @param {() => void} props.onEnablePress
 * @param {boolean} [props.loading]
 */
export function SubscriptionsEnablePaymentsGate({ onEnablePress, loading = false }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 14,
        },
        connectedRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 2,
        },
        connectedTitle: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
        },
        gateCard: {
          gap: 12,
        },
        gateTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          letterSpacing: -0.3,
          lineHeight: 24,
        },
        gateBody: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="subscriptions-enable-payments-gate">
      <View style={styles.connectedRow}>
        <Ionicons color="#22c55e" name="checkmark-circle" size={22} />
        <AppText style={styles.connectedTitle}>{SUBSCRIPTIONS_PAYMENTS_OFF_CONNECTED}</AppText>
      </View>

      <SurfaceCard outlined padding="md" style={styles.gateCard}>
        <AppText style={styles.gateTitle}>{SUBSCRIPTIONS_PAYMENTS_OFF_TITLE}</AppText>
        <AppText style={styles.gateBody}>{SUBSCRIPTIONS_PAYMENTS_OFF_BODY}</AppText>
        <Button
          disabled={loading}
          fullWidth
          labelColor="#0b0c0f"
          title={loading ? 'Enabling…' : SUBSCRIPTIONS_PAYMENTS_OFF_CTA}
          variant="surfaceLight"
          onPress={onEnablePress}
        />
      </SurfaceCard>
    </View>
  );
}
