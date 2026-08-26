import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, frostedSurfaceColors } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * Wallet-style Stripe balance: available is the hero, on the way sits underneath.
 * Card fill matches the frosted transaction icon wells.
 *
 * @param {{
 *   availableCaption: string;
 *   availableLabel: string;
 *   pendingCaption: string;
 *   pendingLabel: string;
 * }} props
 */
export function PaymentsTransactionsBalance({
  availableCaption,
  availableLabel,
  pendingCaption,
  pendingLabel,
}) {
  const { colors, isDark } = useTheme();
  const frost = frostedSurfaceColors(isDark);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: frost.backgroundColor,
          borderColor: frost.borderColor,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: 20,
          paddingVertical: 20,
        },
        hero: {
          gap: 6,
        },
        caption: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: 0.2,
        },
        available: {
          color: '#ffffff',
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 34,
          fontWeight: '700',
          letterSpacing: -1.1,
          lineHeight: 40,
        },
        pendingRow: {
          alignItems: 'center',
          borderTopColor: frost.borderColor,
          borderTopWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          marginTop: 16,
          paddingTop: 14,
          width: '100%',
        },
        pendingLabelCol: {
          flex: 1,
          minWidth: 0,
        },
        pendingAmountCol: {
          flexShrink: 0,
        },
        pendingCaption: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
        },
        pendingValue: {
          color: '#ffffff',
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
      }),
    [colors, frost.backgroundColor, frost.borderColor],
  );

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <AppText style={styles.caption}>{availableCaption}</AppText>
        <AppText style={styles.available}>{availableLabel}</AppText>
      </View>
      <View style={styles.pendingRow}>
        <View style={styles.pendingLabelCol}>
          <AppText style={styles.pendingCaption}>{pendingCaption}</AppText>
        </View>
        <View style={styles.pendingAmountCol}>
          <AppText style={styles.pendingValue}>{pendingLabel}</AppText>
        </View>
      </View>
    </View>
  );
}
