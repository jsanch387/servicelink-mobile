import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Divider } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { formatExpenseDollars } from '../utils/expenseMoney';

function formatMinusDollars(amount) {
  return `−${formatExpenseDollars(Math.abs(Number(amount) || 0))}`;
}

function formatSignedDollars(amount) {
  const n = Number(amount) || 0;
  if (n < 0) return formatMinusDollars(n);
  return formatExpenseDollars(n);
}

function ReceiptRow({ amountStyle, emphasize = false, label, value }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        labelCol: {
          flex: 1,
          minWidth: 0,
          paddingRight: 12,
        },
        label: {
          color: emphasize ? colors.text : colors.textMuted,
          fontFamily: emphasize ? FONT_FAMILIES.semibold : FONT_FAMILIES.medium,
          fontSize: emphasize ? 16 : 15,
          letterSpacing: emphasize ? -0.2 : -0.1,
        },
        amountCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
        },
        amount: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          letterSpacing: -0.2,
        },
      }),
    [colors, emphasize],
  );

  return (
    <View style={styles.row}>
      <View style={styles.labelCol}>
        <AppText style={styles.label}>{label}</AppText>
      </View>
      <View style={styles.amountCol}>
        <AppText style={[styles.amount, amountStyle]}>{value}</AppText>
      </View>
    </View>
  );
}

/**
 * Revenue − spent = profit, for the same window as the overview chart.
 *
 * @param {object} props
 * @param {number} props.revenue
 * @param {number} props.spent
 * @param {number} props.left
 */
export function ExpenseBalanceReceipt({ revenue, spent, left }) {
  const { colors } = useTheme();
  const profitUp = left >= 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 10,
        },
        dividerWrap: {
          marginVertical: 4,
        },
        leftAmount: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          letterSpacing: -0.4,
        },
        leftUp: {
          color: colors.moneyPositive,
        },
        leftDown: {
          color: colors.danger,
        },
      }),
    [colors],
  );

  return (
    <View
      accessibilityLabel={`Revenue ${formatExpenseDollars(revenue)}, spent ${formatExpenseDollars(spent)}, profit ${formatExpenseDollars(left)}`}
      style={styles.stack}
    >
      <ReceiptRow label="Revenue" value={formatExpenseDollars(revenue)} />
      <ReceiptRow label="Spent" value={formatMinusDollars(spent)} />
      <View style={styles.dividerWrap}>
        <Divider />
      </View>
      <ReceiptRow
        emphasize
        label="Profit"
        value={formatSignedDollars(left)}
        amountStyle={[styles.leftAmount, profitUp ? styles.leftUp : styles.leftDown]}
      />
    </View>
  );
}
