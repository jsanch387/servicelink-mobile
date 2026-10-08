import { useMemo } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { FONT_FAMILIES, useTheme } from '../../theme';
import { AppText } from './AppText';

const RING_SIZE = 16;
const RING_STROKE = 2;

/**
 * Wizard title row used by create-invoice and create-quote: large title, step ring, and count.
 *
 * @param {{ title: string; stepIndex: number; stepCount: number }} props
 */
export function WizardStepTitle({ title, stepIndex, stepCount }) {
  const { colors } = useTheme();
  const safeCount = Math.max(1, stepCount);
  const progress = (stepIndex + 1) / safeCount;
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const center = RING_SIZE / 2;
  const circumference = 2 * Math.PI * radius;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          paddingBottom: 32,
          paddingTop: 8,
        },
        titleCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 28,
          letterSpacing: -0.6,
          lineHeight: 34,
        },
        stepRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
          marginLeft: 12,
        },
        stepCount: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          letterSpacing: 0.2,
        },
      }),
    [colors],
  );

  return (
    <Pressable accessible={false} style={styles.header} onPress={Keyboard.dismiss}>
      <View style={styles.titleCol}>
        <AppText accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
      </View>
      <View accessibilityLabel={`Step ${stepIndex + 1} of ${safeCount}`} style={styles.stepRow}>
        <Svg height={RING_SIZE} width={RING_SIZE}>
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={colors.border}
            strokeWidth={RING_STROKE}
          />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={colors.text}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            strokeWidth={RING_STROKE}
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
        <AppText style={styles.stepCount}>
          {stepIndex + 1} of {safeCount}
        </AppText>
      </View>
    </Pressable>
  );
}
