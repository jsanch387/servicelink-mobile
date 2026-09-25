import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { expenseCategoryLabel } from '../constants/expenseCategories';
import { formatExpenseDayLabel } from '../utils/expenseDate';
import { formatExpenseDollars } from '../utils/expenseMoney';

/**
 * Compact register row: name + day on the left, amount + category on the right.
 *
 * @param {object} props
 * @param {{ id: string; name: string; amount: number; chargedOn: string }} props.expense
 * @param {boolean} [props.showDividerBelow]
 * @param {() => void} props.onPress
 */
export function ExpenseRow({ expense, showDividerBelow = true, onPress }) {
  const { colors } = useTheme();
  const dayLabel = formatExpenseDayLabel(expense.chargedOn);
  const categoryLabel = expenseCategoryLabel(expense.category);
  const amountLabel = formatExpenseDollars(expense.amount);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingVertical: 10,
          width: '100%',
        },
        pressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        labelCol: {
          flex: 1,
          flexShrink: 1,
          justifyContent: 'center',
          minWidth: 0,
          overflow: 'hidden',
          paddingRight: 12,
        },
        amountCol: {
          alignItems: 'flex-end',
          flexShrink: 0,
          justifyContent: 'center',
          maxWidth: '42%',
        },
        name: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.2,
          overflow: 'hidden',
        },
        amount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.2,
        },
        meta: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 12,
          marginTop: 6,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: 16,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityHint="Opens expense details"
      accessibilityLabel={`${expense.name}, ${amountLabel}, ${dayLabel}, ${categoryLabel}`}
      accessibilityRole="button"
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={styles.root}>
          <View style={[styles.row, pressed && styles.pressed]}>
            <View style={styles.labelCol}>
              <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.name}>
                {expense.name}
              </AppText>
              {dayLabel ? (
                <AppText numberOfLines={1} style={styles.meta}>
                  {dayLabel}
                </AppText>
              ) : null}
            </View>
            <View style={styles.amountCol}>
              <AppText style={styles.amount}>{amountLabel}</AppText>
              {categoryLabel ? (
                <AppText numberOfLines={1} style={styles.meta}>
                  {categoryLabel}
                </AppText>
              ) : null}
            </View>
          </View>
          {showDividerBelow ? <View style={styles.divider} /> : null}
        </View>
      )}
    </Pressable>
  );
}
