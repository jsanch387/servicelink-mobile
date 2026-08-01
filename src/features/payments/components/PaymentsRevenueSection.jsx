import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText, InlineCardError, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { REVENUE_RANGE, REVENUE_EMPTY_CAPTION } from '../constants/paymentsRevenueRanges';
import { usePaymentsRevenue } from '../hooks/usePaymentsRevenue';
import { PaymentsRevenueRangePicker } from './PaymentsRevenueRangePicker';

const CHART_H = 200;
const CHART_PAD_X = 10;
const CHART_PAD_TOP = 32;
const CHART_PAD_BOTTOM = 10;
/** Width used to pin axis labels to the same x as chart dots. */
const CHART_LABEL_W = 44;

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

function bestPeriodTitle(range) {
  if (range === REVENUE_RANGE.WEEK) return 'Best day';
  if (range === REVENUE_RANGE.MONTH) return 'Best week';
  if (range === REVENUE_RANGE.YEAR) return 'Best month';
  return 'Best year';
}

function buildAreaPaths(points, width) {
  const w = Math.max(width, 1);
  if (!points.length) return { line: '', area: '', coords: [] };
  const max = Math.max(...points.map((p) => p.cents), 1);
  const innerW = w - CHART_PAD_X * 2;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? CHART_PAD_X + innerW / 2
        : CHART_PAD_X + (i / (points.length - 1)) * innerW;
    const y = CHART_PAD_TOP + innerH - (p.cents / max) * innerH;
    return { x, y };
  });

  let line = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i += 1) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const cx = (prev.x + curr.x) / 2;
    line += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  const last = coords[coords.length - 1];
  const first = coords[0];
  const baseline = CHART_H - CHART_PAD_BOTTOM;
  const area = `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;

  return { line, area, coords };
}

function pickBest(bars) {
  if (!Array.isArray(bars) || bars.length === 0) return null;
  const best = bars.reduce((acc, row) => (row.cents > acc.cents ? row : acc), bars[0]);
  return best.cents > 0 ? best : null;
}

function indexFromTouchX(locationX, width, count) {
  if (count <= 1) return 0;
  const innerW = Math.max(width - CHART_PAD_X * 2, 1);
  const clamped = Math.max(0, Math.min(innerW, locationX - CHART_PAD_X));
  return Math.round((clamped / innerW) * (count - 1));
}

/**
 * Place an axis label under a chart dot: first flush left, last flush right, others centered.
 * @param {number} x
 * @param {number} index
 * @param {number} count
 */
function chartLabelLeft(x, index, count) {
  if (count <= 1) return Math.max(0, x - CHART_LABEL_W / 2);
  if (index === 0) return x;
  if (index === count - 1) return x - CHART_LABEL_W;
  return x - CHART_LABEL_W / 2;
}

/**
 * Payments → Revenue: collected total + range chart from completed appointments.
 *
 * @param {{ businessId: string | null | undefined }} props
 */
export function PaymentsRevenueSection({ businessId }) {
  const { colors, isDark } = useTheme();
  const { range, setRange, summary, isPending, isError, errorMessage } = usePaymentsRevenue({
    businessId,
  });

  const bars = summary.bars;
  const best = pickBest(bars);
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, bars.length - 1));

  useEffect(() => {
    setSelectedIndex(Math.max(0, bars.length - 1));
  }, [range, bars.length]);

  const plotWidth = chartWidth > 0 ? chartWidth : 320;
  const chart = useMemo(() => buildAreaPaths(bars, plotWidth), [bars, plotWidth]);

  const activeIndex = Math.min(selectedIndex, Math.max(0, bars.length - 1));
  const activeBar = bars[activeIndex] ?? null;
  const activeCoord = chart.coords[activeIndex] ?? null;

  const selectFromTouch = (locationX) => {
    const width = chartWidth > 0 ? chartWidth : 1;
    setSelectedIndex(indexFromTouchX(locationX, width, bars.length));
  };

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
        },
        heroAmount: {
          color: colors.text,
          flex: 1,
          flexShrink: 1,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 40,
          fontWeight: '700',
          letterSpacing: -1.4,
          lineHeight: 46,
          minWidth: 0,
        },
        changePill: {
          alignSelf: 'flex-start',
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.16)' : 'rgba(22, 163, 74, 0.12)',
          borderRadius: 999,
          marginTop: 2,
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
        chartTouch: {
          alignSelf: 'stretch',
          height: CHART_H,
          position: 'relative',
          width: '100%',
        },
        chartLabels: {
          height: 20,
          marginTop: 8,
          position: 'relative',
          width: '100%',
        },
        chartLabelHit: {
          position: 'absolute',
          top: 0,
          width: CHART_LABEL_W,
        },
        chartLabelName: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
        },
        chartLabelNameActive: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontWeight: '600',
        },
        chartLabelAlignStart: {
          textAlign: 'left',
        },
        chartLabelAlignCenter: {
          textAlign: 'center',
        },
        chartLabelAlignEnd: {
          textAlign: 'right',
        },
        tooltip: {
          alignItems: 'center',
          left: 0,
          position: 'absolute',
          top: 0,
          width: 92,
          zIndex: 2,
        },
        tooltipBubble: {
          backgroundColor: isDark ? '#fafafa' : colors.text,
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        tooltipAmount: {
          color: isDark ? '#0a0a0a' : colors.shell,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 13,
          fontWeight: '700',
          textAlign: 'center',
        },
        tooltipName: {
          color: isDark ? '#525252' : 'rgba(255,255,255,0.72)',
          fontSize: 11,
          fontWeight: '500',
          marginTop: 1,
          textAlign: 'center',
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
          marginTop: 8,
        },
      }),
    [colors, isDark],
  );

  const tooltipLeft = activeCoord
    ? Math.min(Math.max(activeCoord.x - 46, 0), Math.max(plotWidth - 92, 0))
    : 0;

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
            <AppText style={styles.heroAmount}>{formatUsd(summary.collectedCents)}</AppText>
            <PaymentsRevenueRangePicker value={range} onChange={setRange} />
          </View>
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

        <View style={styles.chartWrap}>
          <View
            accessible
            accessibilityHint="Touch and drag to see each period"
            accessibilityLabel={
              activeBar ? `${activeBar.fullLabel}, ${formatUsd(activeBar.cents)}` : 'Revenue chart'
            }
            accessibilityRole="adjustable"
            style={styles.chartTouch}
            onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={(e) => selectFromTouch(e.nativeEvent.locationX)}
            onResponderMove={(e) => selectFromTouch(e.nativeEvent.locationX)}
            onStartShouldSetResponder={() => true}
          >
            {activeBar && activeCoord ? (
              <View pointerEvents="none" style={[styles.tooltip, { left: tooltipLeft }]}>
                <View style={styles.tooltipBubble}>
                  <AppText style={styles.tooltipAmount}>{formatUsd(activeBar.cents)}</AppText>
                  <AppText style={styles.tooltipName}>{activeBar.fullLabel}</AppText>
                </View>
              </View>
            ) : null}

            <Svg
              height={CHART_H}
              pointerEvents="none"
              preserveAspectRatio="none"
              viewBox={`0 0 ${plotWidth} ${CHART_H}`}
              width={plotWidth}
            >
              <Defs>
                <LinearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <Stop
                    offset="0"
                    stopColor={colors.moneyPositive}
                    stopOpacity={isDark ? 0.34 : 0.26}
                  />
                  <Stop offset="1" stopColor={colors.moneyPositive} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Path d={chart.area} fill="url(#revenueFill)" />
              <Path
                d={chart.line}
                fill="none"
                stroke={colors.moneyPositive}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3.25}
              />
              {activeCoord ? (
                <Line
                  stroke={isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'}
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  x1={activeCoord.x}
                  x2={activeCoord.x}
                  y1={CHART_PAD_TOP}
                  y2={CHART_H - CHART_PAD_BOTTOM}
                />
              ) : null}
              {chart.coords.map((coord, index) => {
                const selected = index === activeIndex;
                return (
                  <Circle
                    key={`pt-${index}`}
                    cx={coord.x}
                    cy={coord.y}
                    fill={selected ? colors.moneyPositive : colors.shell}
                    r={selected ? 6 : 3.5}
                    stroke={colors.moneyPositive}
                    strokeWidth={selected ? 3 : 2}
                  />
                );
              })}
            </Svg>
          </View>

          <View style={styles.chartLabels}>
            {bars.map((bar, index) => {
              const dense = bars.length > 7;
              const showName =
                !dense ||
                index === 0 ||
                index === bars.length - 1 ||
                index % 2 === 0 ||
                index === activeIndex;
              const isActive = index === activeIndex;
              const isFirst = index === 0;
              const isLast = index === bars.length - 1;
              const x = chart.coords[index]?.x ?? 0;
              return (
                <Pressable
                  key={bar.key}
                  accessibilityRole="button"
                  style={[styles.chartLabelHit, { left: chartLabelLeft(x, index, bars.length) }]}
                  onPress={() => setSelectedIndex(index)}
                >
                  <AppText
                    style={[
                      styles.chartLabelName,
                      isActive && styles.chartLabelNameActive,
                      isFirst
                        ? styles.chartLabelAlignStart
                        : isLast
                          ? styles.chartLabelAlignEnd
                          : styles.chartLabelAlignCenter,
                    ]}
                  >
                    {showName ? bar.label : ' '}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.twinRow}>
        <SurfaceCard style={styles.twinCard}>
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

        <SurfaceCard style={styles.twinCard}>
          <View style={styles.twinHeader}>
            <View style={styles.twinIcon}>
              <Ionicons color={colors.textMuted} name="sunny-outline" size={16} />
            </View>
            <AppText style={styles.twinLabel}>{bestPeriodTitle(range)}</AppText>
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
