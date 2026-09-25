import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { formatExpenseMonthLabel, groupExpensesByMonth } from '../utils/expenseDate';
import { formatExpenseDollars, sumExpenseAmounts } from '../utils/expenseMoney';
import { ExpenseEmptyState } from './ExpenseEmptyState';
import { ExpenseRow } from './ExpenseRow';

/**
 * Month-grouped expense register.
 *
 * @param {object} props
 * @param {Array<object>} props.expenses
 * @param {(expense: object) => void} props.onExpensePress
 * @param {boolean} [props.hasNextPage]
 * @param {boolean} [props.isFetchingNextPage]
 * @param {() => void} [props.onLoadMore]
 */
export function ExpenseList({
  expenses,
  onExpensePress,
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
}) {
  const { colors } = useTheme();
  const monthGroups = useMemo(() => groupExpensesByMonth(expenses), [expenses]);
  const hasExpenses = monthGroups.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 22,
        },
        monthBlock: {
          gap: 8,
        },
        monthHeader: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingHorizontal: 4,
          width: '100%',
        },
        monthLabelCol: {
          flex: 1,
          minWidth: 0,
        },
        monthLabel: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 17,
          letterSpacing: -0.25,
        },
        monthTotalCol: {
          flexShrink: 0,
        },
        monthTotal: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
        },
        listCard: {
          borderRadius: 14,
          overflow: 'hidden',
        },
        loadMore: {
          marginTop: 4,
        },
      }),
    [colors],
  );

  if (!hasExpenses) {
    return <ExpenseEmptyState body="Add an expense to track it here." title="No expenses yet" />;
  }

  return (
    <View style={styles.stack}>
      {monthGroups.map((group) => {
        const monthTotal = formatExpenseDollars(sumExpenseAmounts(group.expenses));
        return (
          <View key={group.monthKey} style={styles.monthBlock}>
            <View style={styles.monthHeader}>
              <View style={styles.monthLabelCol}>
                <AppText numberOfLines={1} style={styles.monthLabel}>
                  {formatExpenseMonthLabel(group.monthKey)}
                </AppText>
              </View>
              <View style={styles.monthTotalCol}>
                <AppText style={styles.monthTotal}>{monthTotal}</AppText>
              </View>
            </View>
            <SurfaceCard outlined={false} padding="none" style={styles.listCard}>
              {group.expenses.map((expense, index) => (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  showDividerBelow={index < group.expenses.length - 1}
                  onPress={() => onExpensePress(expense)}
                />
              ))}
            </SurfaceCard>
          </View>
        );
      })}
      {hasNextPage ? (
        <View style={styles.loadMore}>
          <Button
            fullWidth
            loading={isFetchingNextPage}
            title="Load more"
            variant="secondary"
            onPress={onLoadMore}
          />
        </View>
      ) : null}
    </View>
  );
}
