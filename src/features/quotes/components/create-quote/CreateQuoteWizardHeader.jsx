import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';

/**
 * @param {object} props
 * @param {number} props.stepIndex - 0-based
 * @param {number} props.stepCount
 * @param {string} props.title
 * @param {string} props.subtitle
 */
export function CreateQuoteWizardHeader({ stepIndex, stepCount, title, subtitle }) {
  const { colors } = useTheme();
  const progress =
    stepCount > 0 ? Math.min(100, Math.max(0, ((stepIndex + 1) / stepCount) * 100)) : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 16,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
        track: {
          backgroundColor: colors.border,
          borderRadius: 2,
          height: 4,
          marginBottom: 6,
          overflow: 'hidden',
          width: '100%',
        },
        fill: {
          backgroundColor: colors.accent,
          borderRadius: 2,
          height: '100%',
        },
        eyebrow: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.2,
          marginBottom: 22,
          textTransform: 'uppercase',
        },
        title: {
          color: colors.text,
          fontSize: 26,
          fontWeight: '700',
          letterSpacing: -0.6,
          lineHeight: 30,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
      }),
    [colors],
  );

  const label = `Step ${stepIndex + 1} of ${stepCount}`;

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel={`Quote wizard progress ${Math.round(progress)} percent`}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <AppText style={styles.eyebrow}>{label}</AppText>
      <AppText style={styles.title}>{title}</AppText>
      <AppText style={styles.subtitle}>{subtitle}</AppText>
    </View>
  );
}
