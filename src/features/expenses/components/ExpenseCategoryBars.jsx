import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { formatExpenseDollars } from '../utils/expenseMoney';

/**
 * Labeled category bars for this month — each row is name, amount, then a share bar.
 */
export function ExpenseCategoryBars({ categories }) {
  const { colors, isDark } = useTheme();
  const max = Math.max(...categories.map((row) => row.amount), 0);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 16,
        },
        item: {
          gap: 8,
          width: '100%',
        },
        top: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        nameCol: {
          flex: 1,
          minWidth: 0,
          paddingRight: 12,
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        amountCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
        },
        amount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        track: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
          borderRadius: 6,
          height: 10,
          overflow: 'hidden',
          width: '100%',
        },
        fill: {
          backgroundColor: colors.text,
          borderRadius: 6,
          height: '100%',
        },
      }),
    [colors, isDark],
  );

  if (max <= 0) return null;

  return (
    <View style={styles.stack}>
      {categories.map((row) => (
        <View key={row.key} style={styles.item}>
          <View style={styles.top}>
            <View style={styles.nameCol}>
              <AppText numberOfLines={1} style={styles.name}>
                {row.label}
              </AppText>
            </View>
            <View style={styles.amountCol}>
              <AppText style={styles.amount}>{formatExpenseDollars(row.amount)}</AppText>
            </View>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.max((row.amount / max) * 100, 6)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}
