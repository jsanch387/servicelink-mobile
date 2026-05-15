import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * Compact payment status for booking details.
 *
 * @param {object} props
 * @param {object} props.payment — output of {@link buildBookingPaymentSection}
 */
export function BookingPaymentSection({ payment }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          gap: 4,
        },
        status: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: 20,
        },
        detail: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 19,
        },
      }),
    [colors],
  );

  if (!payment?.visible || !payment.status) {
    return null;
  }

  const { status, detail, accessibilityLabel } = payment;

  return (
    <DetailsSectionCard bodyPadding="default" title="Payment">
      <View accessible accessibilityLabel={accessibilityLabel} style={styles.body}>
        <AppText includeFontPadding={false} style={styles.status}>
          {status}
        </AppText>
        {detail ? (
          <AppText includeFontPadding={false} style={styles.detail}>
            {detail}
          </AppText>
        ) : null}
      </View>
    </DetailsSectionCard>
  );
}
