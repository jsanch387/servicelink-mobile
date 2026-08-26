import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  TAP_TO_PAY_PREPARING_COLD,
  TAP_TO_PAY_PREPARING_WARM,
  TAP_TO_PAY_PROCESSING_STATUS,
} from '../../../tap-to-pay/constants/tapToPayCopy';

/**
 * Full-screen echo bars while walk-up Charge opens Apple Tap to Pay.
 *
 * @param {{
 *   phase?: 'idle' | 'loading_intent' | 'intent_error' | 'preparing' | 'processing' | 'success' | 'error';
 *   readerWasWarm?: boolean;
 * }} props
 */
export function CreatePaymentChargePending({ phase = 'preparing', readerWasWarm = false }) {
  const { colors } = useTheme();
  const statusLine =
    phase === 'processing'
      ? TAP_TO_PAY_PROCESSING_STATUS
      : readerWasWarm
        ? TAP_TO_PAY_PREPARING_WARM
        : TAP_TO_PAY_PREPARING_COLD;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 32,
        },
        status: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginTop: 16,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} testID="create-payment-charge-pending">
      <EchoBarsLoader
        accessibilityLabel={statusLine}
        color={colors.text}
        size="large"
      />
      <AppText style={styles.status}>{statusLine}</AppText>
    </View>
  );
}
