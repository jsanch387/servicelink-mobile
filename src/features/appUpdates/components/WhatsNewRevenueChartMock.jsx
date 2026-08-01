import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

const W = 280;
const H = 88;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 10;

/** Decorative sample points — not real data. */
const SAMPLE = [0.22, 0.28, 0.35, 0.32, 0.48, 0.55, 0.62, 0.58, 0.78, 0.92];

/**
 * Decorative revenue chart for the What’s New modal (not live data).
 */
export function WhatsNewRevenueChartMock() {
  const { colors, isDark } = useTheme();

  const { line, area, last } = useMemo(() => {
    const innerW = W - PAD_X * 2;
    const innerH = H - PAD_TOP - PAD_BOTTOM;
    const coords = SAMPLE.map((t, i) => {
      const x = PAD_X + (i / (SAMPLE.length - 1)) * innerW;
      const y = PAD_TOP + innerH * (1 - t);
      return { x, y };
    });

    let linePath = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i += 1) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cx = (prev.x + curr.x) / 2;
      linePath += ` C ${cx} ${prev.y}, ${cx} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const baseline = H - PAD_BOTTOM;
    const first = coords[0];
    const end = coords[coords.length - 1];
    const areaPath = `${linePath} L ${end.x} ${baseline} L ${first.x} ${baseline} Z`;

    return { line: linePath, area: areaPath, last: end };
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.shell,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          marginBottom: 18,
          overflow: 'hidden',
          paddingBottom: 12,
          paddingHorizontal: 14,
          paddingTop: 14,
        },
        header: {
          alignItems: 'baseline',
          flexDirection: 'row',
          gap: 8,
          marginBottom: 4,
        },
        amount: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.6,
        },
        pill: {
          backgroundColor: isDark ? 'rgba(52, 199, 89, 0.16)' : 'rgba(52, 199, 89, 0.12)',
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 3,
        },
        pillText: {
          color: colors.moneyPositive,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          fontWeight: '600',
        },
        chart: {
          alignSelf: 'center',
          marginTop: 4,
        },
      }),
    [colors, isDark],
  );

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.root}
    >
      <View style={styles.header}>
        <AppText style={styles.amount}>$2,480</AppText>
        <View style={styles.pill}>
          <AppText style={styles.pillText}>↑ 18% vs last month</AppText>
        </View>
      </View>
      <Svg height={H} style={styles.chart} viewBox={`0 0 ${W} ${H}`} width="100%">
        <Defs>
          <LinearGradient id="whatsNewRevenueFill" x1="0" x2="0" y1="0" y2="1">
            <Stop offset="0" stopColor={colors.moneyPositive} stopOpacity={isDark ? 0.34 : 0.26} />
            <Stop offset="1" stopColor={colors.moneyPositive} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#whatsNewRevenueFill)" />
        <Path
          d={line}
          fill="none"
          stroke={colors.moneyPositive}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.75}
        />
        <Circle
          cx={last.x}
          cy={last.y}
          fill={colors.shell}
          r={5}
          stroke={colors.moneyPositive}
          strokeWidth={2.5}
        />
      </Svg>
    </View>
  );
}
