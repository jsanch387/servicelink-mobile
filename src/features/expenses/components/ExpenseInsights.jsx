import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard, TimeRangePicker, TrendAreaChart } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { EXPENSE_RANGE, EXPENSE_RANGE_FILTERS } from '../constants/expenseRanges';
import { formatExpenseDollars } from '../utils/expenseMoney';
import { ExpenseBalanceReceipt } from './ExpenseBalanceReceipt';
import { ExpenseCategoryBars } from './ExpenseCategoryBars';

/**
 * Visual overview of money leaving the business for the selected period.
 *
 * @param {object} props
 * @param {ReturnType<import('../utils/summarizeExpenseOutflow').summarizeExpenseOutflow>} props.outflow
 * @param {string} props.range
 * @param {string | null} [props.customFromYmd]
 * @param {string | null} [props.customToYmd]
 * @param {(next: string) => void} props.onRangeChange
 * @param {(next: { fromYmd: string; toYmd: string }) => void} props.onSelectCustom
 */
export function ExpenseInsights({
  outflow,
  range,
  customFromYmd = null,
  customToYmd = null,
  onRangeChange,
  onSelectCustom,
}) {
  const { colors, isDark } = useTheme();
  const spendingUp = (outflow.changePct ?? 0) > 0;
  const spendingDown = (outflow.changePct ?? 0) < 0;
  const spendingFlat = outflow.changePct === 0;
  const showChange = outflow.changePct != null && outflow.compareLabel;
  const chartPoints = useMemo(
    () =>
      (outflow.bars ?? []).map((bar) => ({
        key: bar.key,
        label: bar.label,
        fullLabel: bar.fullLabel,
        value: bar.amount,
      })),
    [outflow.bars],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 16,
        },
        heroCard: {
          gap: 12,
        },
        heroHeader: {
          gap: 8,
        },
        amountRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          width: '100%',
        },
        amountCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        rangeCol: {
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        heroAmount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 40,
          fontWeight: '700',
          letterSpacing: -1.4,
          lineHeight: 46,
        },
        metaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          marginTop: 2,
          width: '100%',
        },
        metaLeft: {
          flex: 1,
          minWidth: 0,
        },
        rangeDatesCol: {
          alignItems: 'flex-end',
          justifyContent: 'center',
        },
        rangeDates: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.1,
          textAlign: 'right',
        },
        changePill: {
          alignSelf: 'flex-start',
          backgroundColor: isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(220, 38, 38, 0.1)',
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        changePillDown: {
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.16)' : 'rgba(22, 163, 74, 0.12)',
        },
        changePillMuted: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.buttonSecondaryBg,
        },
        changePillText: {
          color: colors.danger,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
        },
        changePillTextDown: {
          color: colors.moneyPositive,
        },
        changePillTextMuted: {
          color: colors.textMuted,
        },
        chartWrap: {
          alignSelf: 'stretch',
          marginBottom: 2,
          marginTop: 4,
          width: '100%',
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.stack}>
      <SurfaceCard outlined={false} style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.amountRow}>
            <View style={styles.amountCol}>
              <AppText style={styles.heroAmount}>{formatExpenseDollars(outflow.total)}</AppText>
            </View>
            <View style={styles.rangeCol}>
              <TimeRangePicker
                customFromYmd={customFromYmd}
                customKey={EXPENSE_RANGE.CUSTOM}
                customToYmd={customToYmd}
                options={EXPENSE_RANGE_FILTERS}
                value={range}
                onChange={onRangeChange}
                onSelectCustom={onSelectCustom}
              />
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              {showChange ? (
                <View
                  style={[
                    styles.changePill,
                    spendingDown && styles.changePillDown,
                    spendingFlat && styles.changePillMuted,
                  ]}
                >
                  <AppText
                    style={[
                      styles.changePillText,
                      spendingDown && styles.changePillTextDown,
                      spendingFlat && styles.changePillTextMuted,
                    ]}
                  >
                    {spendingUp ? '↑' : spendingDown ? '↓' : ''}
                    {spendingFlat ? '' : ' '}
                    {Math.abs(outflow.changePct)}% {outflow.compareLabel}
                  </AppText>
                </View>
              ) : range === EXPENSE_RANGE.ALL ? (
                <View style={[styles.changePill, styles.changePillMuted]}>
                  <AppText style={[styles.changePillText, styles.changePillTextMuted]}>
                    All expenses
                  </AppText>
                </View>
              ) : null}
            </View>
            {outflow.windowCaption ? (
              <View style={styles.rangeDatesCol}>
                <AppText style={styles.rangeDates}>{outflow.windowCaption}</AppText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.chartWrap}>
          <TrendAreaChart
            color={colors.danger}
            fallbackAccessibilityLabel="Expense chart"
            formatValue={formatExpenseDollars}
            gradientId="expenseFill"
            initialSelection="none"
            points={chartPoints}
          />
        </View>
      </SurfaceCard>

      {outflow.kept ? (
        <SurfaceCard outlined={false}>
          <ExpenseBalanceReceipt
            left={outflow.kept.kept}
            revenue={outflow.kept.revenue}
            spent={outflow.total}
          />
        </SurfaceCard>
      ) : null}

      {outflow.categories.length > 0 ? (
        <SurfaceCard outlined={false}>
          <ExpenseCategoryBars categories={outflow.categories} />
        </SurfaceCard>
      ) : null}
    </View>
  );
}
