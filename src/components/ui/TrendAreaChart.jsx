import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { FONT_FAMILIES, useTheme } from '../../theme';
import { AppText } from './AppText';
import { TREND_CHART_LABEL_SLOT, pickTrendChartLabelIndexes } from './trendChartLabels';

const CHART_H = 200;
const CHART_PAD_X = 10;
const CHART_PAD_TOP = 32;
const CHART_PAD_BOTTOM = 10;

function buildAreaPaths(points, width) {
  const w = Math.max(width, 1);
  if (!points.length) return { line: '', area: '', coords: [] };
  const max = Math.max(...points.map((p) => p.value), 1);
  const innerW = w - CHART_PAD_X * 2;
  const innerH = CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const coords = points.map((p, i) => {
    const x =
      points.length === 1
        ? CHART_PAD_X + innerW / 2
        : CHART_PAD_X + (i / (points.length - 1)) * innerW;
    const y = CHART_PAD_TOP + innerH - (p.value / max) * innerH;
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

function indexFromTouchX(locationX, width, count) {
  if (count <= 1) return 0;
  const innerW = Math.max(width - CHART_PAD_X * 2, 1);
  const clamped = Math.max(0, Math.min(innerW, locationX - CHART_PAD_X));
  return Math.round((clamped / innerW) * (count - 1));
}

function chartLabelLeft(x, index, count, boxW) {
  if (count <= 1) return Math.max(0, x - boxW / 2);
  if (index === 0) return x;
  if (index === count - 1) return x - boxW;
  return x - boxW / 2;
}

/**
 * Interactive area chart used on Payments revenue and Expenses overview.
 *
 * @param {object} props
 * @param {Array<{ key: string; label: string; fullLabel?: string; value: number }>} props.points
 * @param {(value: number) => string} props.formatValue
 * @param {string} props.color
 * @param {string} [props.gradientId]
 * @param {string} [props.accessibilityHint]
 * @param {string} [props.fallbackAccessibilityLabel]
 * @param {'last' | 'none'} [props.initialSelection]
 */
export function TrendAreaChart({
  points,
  formatValue,
  color,
  gradientId = 'trendFill',
  accessibilityHint = 'Touch and drag to see each period',
  fallbackAccessibilityLabel = 'Chart',
  initialSelection = 'last',
}) {
  const { colors, isDark } = useTheme();
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(() =>
    initialSelection === 'none' || points.length === 0 ? null : points.length - 1,
  );
  const pointKeys = points.map((p) => p.key).join('|');

  useEffect(() => {
    setSelectedIndex(initialSelection === 'none' || points.length === 0 ? null : points.length - 1);
  }, [initialSelection, pointKeys, points.length]);

  const plotWidth = chartWidth > 0 ? chartWidth : 320;
  const chart = useMemo(() => buildAreaPaths(points, plotWidth), [points, plotWidth]);
  const hasSelection = selectedIndex != null && points.length > 0;
  const activeIndex = hasSelection ? Math.min(selectedIndex, points.length - 1) : -1;
  const activePoint = activeIndex >= 0 ? (points[activeIndex] ?? null) : null;
  const activeCoord = activeIndex >= 0 ? (chart.coords[activeIndex] ?? null) : null;

  const selectFromTouch = (locationX) => {
    const width = chartWidth > 0 ? chartWidth : 1;
    setSelectedIndex(indexFromTouchX(locationX, width, points.length));
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignSelf: 'stretch',
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
      }),
    [colors, isDark],
  );

  const tooltipLeft = activeCoord
    ? Math.min(Math.max(activeCoord.x - 46, 0), Math.max(plotWidth - 92, 0))
    : 0;

  return (
    <View style={styles.wrap}>
      <View
        accessible
        accessibilityHint={accessibilityHint}
        accessibilityLabel={
          activePoint
            ? `${activePoint.fullLabel || activePoint.label}, ${formatValue(activePoint.value)}`
            : fallbackAccessibilityLabel
        }
        accessibilityRole="adjustable"
        style={styles.chartTouch}
        onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => selectFromTouch(e.nativeEvent.locationX)}
        onResponderMove={(e) => selectFromTouch(e.nativeEvent.locationX)}
        onStartShouldSetResponder={() => true}
      >
        {activePoint && activeCoord ? (
          <View pointerEvents="none" style={[styles.tooltip, { left: tooltipLeft }]}>
            <View style={styles.tooltipBubble}>
              <AppText style={styles.tooltipAmount}>{formatValue(activePoint.value)}</AppText>
              <AppText style={styles.tooltipName}>
                {activePoint.fullLabel || activePoint.label}
              </AppText>
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
            <LinearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={isDark ? 0.34 : 0.26} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={chart.area} fill={`url(#${gradientId})`} />
          <Path
            d={chart.line}
            fill="none"
            stroke={color}
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
                fill={selected ? color : colors.shell}
                r={selected ? 6 : 3.5}
                stroke={color}
                strokeWidth={selected ? 3 : 2}
              />
            );
          })}
        </Svg>
      </View>

      <View style={styles.chartLabels}>
        {pickTrendChartLabelIndexes(points.length, plotWidth).map((index) => {
          const point = points[index];
          if (!point) return null;
          const isActive = index === activeIndex;
          const isFirst = index === 0;
          const isLast = index === points.length - 1;
          const x = chart.coords[index]?.x ?? 0;
          return (
            <Pressable
              key={point.key}
              accessibilityRole="button"
              style={[
                styles.chartLabelHit,
                {
                  left: chartLabelLeft(x, index, points.length, TREND_CHART_LABEL_SLOT),
                  width: TREND_CHART_LABEL_SLOT,
                },
              ]}
              onPress={() => setSelectedIndex(index)}
            >
              <AppText
                numberOfLines={1}
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
                {point.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
