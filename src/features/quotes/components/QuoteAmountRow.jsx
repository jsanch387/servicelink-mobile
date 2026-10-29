import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * Label and amount on one row. Flex sits on the wrapping views.
 *
 * @param {{ label?: string; value?: string }} props
 */
export function QuoteAmountRow({ label, value }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          marginBottom: 10,
          width: '100%',
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        valueCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
          marginLeft: 12,
        },
        label: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          lineHeight: 19,
        },
        value: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          lineHeight: 19,
        },
      }),
    [colors],
  );

  const text = String(label ?? '').trim();
  const amount = String(value ?? '').trim();
  if (!text || !amount) return null;

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <AppText numberOfLines={1} style={styles.label}>
          {text}
        </AppText>
      </View>
      <View style={styles.valueCol}>
        <AppText style={styles.value}>{amount}</AppText>
      </View>
    </View>
  );
}

/**
 * Price, tax, and customer total. Renders nothing when there is no tax amount.
 *
 * @param {{
 *   priceValue?: string;
 *   taxLabel?: string;
 *   taxValue?: string;
 *   totalValue?: string;
 * }} props
 */
export function QuoteTaxTotalBlock({ priceValue, taxLabel, taxValue, totalValue }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          marginTop: 14,
          width: '100%',
        },
        totalRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        totalLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        totalValueCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
          marginLeft: 12,
        },
        totalLabel: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        totalValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          letterSpacing: -0.4,
        },
      }),
    [colors],
  );

  const taxAmount = String(taxValue ?? '').trim();
  const total = String(totalValue ?? '').trim();
  if (!taxAmount || !total) return null;

  return (
    <View style={styles.block}>
      <QuoteAmountRow label="Price" value={priceValue} />
      <QuoteAmountRow label={taxLabel || 'Tax'} value={taxAmount} />
      <View style={styles.totalRow}>
        <View style={styles.totalLabelCol}>
          <AppText style={styles.totalLabel}>Total</AppText>
        </View>
        <View style={styles.totalValueCol}>
          <AppText style={styles.totalValue}>{total}</AppText>
        </View>
      </View>
    </View>
  );
}
