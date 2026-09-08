import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText, InlineCardError, SurfaceCard, TrendAreaChart } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { REVENUE_RANGE, REVENUE_EMPTY_CAPTION } from '../constants/paymentsRevenueRanges';
import { usePaymentsRevenue } from '../hooks/usePaymentsRevenue';
import { formatRevenueWindowCaption } from '../utils/revenueDateWindows';
import { PaymentsRevenueRangePicker } from './PaymentsRevenueRangePicker';

function formatUsd(cents, { compact = false } = {}) {
  const dollars = cents / 100;
  if (compact && Math.abs(dollars) >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(dollars);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

function bestPeriodTitle(range, bucketKind) {
  if (range === REVENUE_RANGE.CUSTOM) {
    if (bucketKind === 'weekly') return 'Best week';
    if (bucketKind === 'monthly') return 'Best month';
    return 'Best day';
  }
  if (range === REVENUE_RANGE.WEEK) return 'Best day';
  if (range === REVENUE_RANGE.MONTH) return 'Best week';
  if (range === REVENUE_RANGE.YEAR) return 'Best month';
  return 'Best year';
}

function pickBest(bars) {
  if (!Array.isArray(bars) || bars.length === 0) return null;
  const best = bars.reduce((acc, row) => (row.cents > acc.cents ? row : acc), bars[0]);
  return best.cents > 0 ? best : null;
}

/**
 * Payments → Revenue: collected total + range chart from completed appointments.
 *
 * @param {{ businessId: string | null | undefined }} props
 */
export function PaymentsRevenueSection({ businessId }) {
  const { colors, isDark } = useTheme();
  const {
    range,
    setRange,
    customFromYmd,
    customToYmd,
    fromYmd,
    toYmd,
    selectCustomRange,
    summary,
    isPending,
    isError,
    errorMessage,
  } = usePaymentsRevenue({
    businessId,
  });

  const windowCaption = useMemo(() => formatRevenueWindowCaption(fromYmd, toYmd), [fromYmd, toYmd]);

  const bars = summary.bars;
  const best = pickBest(bars);
  const chartPoints = useMemo(
    () =>
      bars.map((bar) => ({
        key: bar.key,
        label: bar.label,
        fullLabel: bar.fullLabel,
        value: bar.cents,
      })),
    [bars],
  );

  const miniBars = useMemo(() => {
    const max = Math.max(...bars.map((b) => b.cents), 1);
    return bars.map((bar) => ({
      key: bar.key,
      heightPct: Math.max((bar.cents / max) * 100, 10),
      isBest: best ? bar.key === best.key : false,
    }));
  }, [bars, best]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 14,
        },
        heroBlock: {
          gap: 10,
          marginBottom: 8,
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
        heroAmount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 40,
          fontWeight: '700',
          letterSpacing: -1.4,
          lineHeight: 46,
        },
        changePill: {
          alignSelf: 'flex-start',
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.16)' : 'rgba(22, 163, 74, 0.12)',
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        changePillDown: {
          backgroundColor: isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(220, 38, 38, 0.1)',
        },
        changePillMuted: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.buttonSecondaryBg,
        },
        changePillText: {
          color: colors.moneyPositive,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
        },
        changePillTextDown: {
          color: colors.danger,
        },
        changePillTextMuted: {
          color: colors.textMuted,
        },
        chartWrap: {
          alignSelf: 'stretch',
          marginBottom: 6,
          marginTop: 8,
          width: '100%',
        },
        twinRow: {
          flexDirection: 'row',
          gap: 10,
        },
        twinCard: {
          flex: 1,
          gap: 6,
          minHeight: 148,
          paddingBottom: 12,
        },
        twinHeader: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        twinIcon: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.buttonSecondaryBg,
          borderRadius: 8,
          height: 28,
          justifyContent: 'center',
          width: 28,
        },
        twinLabel: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
        },
        twinValue: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.8,
        },
        twinSub: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 10,
        },
        twinTrend: {
          color: colors.moneyPositive,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          fontWeight: '600',
        },
        miniBars: {
          alignItems: 'flex-end',
          flexDirection: 'row',
          gap: 3,
          height: 36,
          marginTop: 'auto',
        },
        miniBar: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : colors.borderStrong,
          borderRadius: 3,
          flex: 1,
          minHeight: 4,
        },
        miniBarBest: {
          backgroundColor: colors.moneyPositive,
        },
        loadingWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 220,
          paddingVertical: 32,
        },
        emptyCaption: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 18,
        },
      }),
    [colors, isDark],
  );

  const isEmpty = !isPending && !isError && summary.jobsPaid === 0;

  if (!businessId) {
    return (
      <SurfaceCard>
        <AppText style={styles.twinSub}>Sign in to see revenue from completed jobs.</AppText>
      </SurfaceCard>
    );
  }

  if (isPending && bars.every((b) => b.cents === 0) && summary.jobsPaid === 0) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const changePct = summary.changePct;
  const showChange = changePct != null && summary.compareLabel;
  const changeUp = (changePct ?? 0) >= 0;

  return (
    <View style={styles.stack}>
      {isError && errorMessage ? <InlineCardError message={errorMessage} /> : null}

      <View style={styles.heroBlock}>
        <View style={styles.heroHeader}>
          <View style={styles.amountRow}>
            <View style={styles.amountCol}>
              <AppText style={styles.heroAmount}>{formatUsd(summary.collectedCents)}</AppText>
            </View>
            <View style={styles.rangeCol}>
              <PaymentsRevenueRangePicker
                customFromYmd={customFromYmd}
                customToYmd={customToYmd}
                value={range}
                onChange={setRange}
                onSelectCustom={selectCustomRange}
              />
            </View>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              {isEmpty ? (
                <AppText style={styles.emptyCaption}>{REVENUE_EMPTY_CAPTION}</AppText>
              ) : showChange ? (
                <View style={[styles.changePill, !changeUp && styles.changePillDown]}>
                  <AppText style={[styles.changePillText, !changeUp && styles.changePillTextDown]}>
                    {changeUp ? '↑' : '↓'} {Math.abs(changePct)}% {summary.compareLabel}
                  </AppText>
                </View>
              ) : range === REVENUE_RANGE.ALL ? (
                <View style={[styles.changePill, styles.changePillMuted]}>
                  <AppText style={[styles.changePillText, styles.changePillTextMuted]}>
                    All completed jobs
                  </AppText>
                </View>
              ) : null}
            </View>
            {windowCaption ? (
              <View style={styles.rangeDatesCol}>
                <AppText style={styles.rangeDates}>{windowCaption}</AppText>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.chartWrap}>
          <TrendAreaChart
            color={colors.moneyPositive}
            fallbackAccessibilityLabel="Revenue chart"
            formatValue={formatUsd}
            gradientId="revenueFill"
            points={chartPoints}
          />
        </View>
      </View>

      <View style={styles.twinRow}>
        <SurfaceCard outlined={false} style={styles.twinCard}>
          <View style={styles.twinHeader}>
            <View style={styles.twinIcon}>
              <Ionicons color={colors.textMuted} name="briefcase-outline" size={16} />
            </View>
            <AppText style={styles.twinLabel}>Jobs paid</AppText>
          </View>
          <AppText style={styles.twinValue}>{summary.jobsPaid}</AppText>
          <AppText style={styles.twinSub}>Completed jobs</AppText>
          <View style={styles.miniBars}>
            {miniBars.map((bar) => (
              <View
                key={bar.key}
                style={[
                  styles.miniBar,
                  bar.isBest && styles.miniBarBest,
                  { height: `${bar.heightPct}%` },
                ]}
              />
            ))}
          </View>
        </SurfaceCard>

        <SurfaceCard outlined={false} style={styles.twinCard}>
          <View style={styles.twinHeader}>
            <View style={styles.twinIcon}>
              <Ionicons color={colors.textMuted} name="sunny-outline" size={16} />
            </View>
            <AppText style={styles.twinLabel}>{bestPeriodTitle(range, summary.bucketKind)}</AppText>
          </View>
          <AppText numberOfLines={1} style={styles.twinValue}>
            {best ? formatUsd(best.cents, { compact: true }) : '—'}
          </AppText>
          <AppText numberOfLines={1} style={styles.twinSub}>
            {best ? best.fullLabel : '—'}
          </AppText>
          <View style={styles.miniBars}>
            {miniBars.map((bar) => (
              <View
                key={`best-${bar.key}`}
                style={[
                  styles.miniBar,
                  bar.isBest && styles.miniBarBest,
                  { height: `${bar.heightPct}%` },
                ]}
              />
            ))}
          </View>
        </SurfaceCard>
      </View>
    </View>
  );
}
