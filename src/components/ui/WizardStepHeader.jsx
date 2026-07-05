import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { SCREEN_GUTTER } from '../../constants/layout';
import { useTheme } from '../../theme';

/**
 * Shared wizard header: progress bar, title, and subtitle (no step count).
 *
 * @param {object} props
 * @param {number} props.stepIndex - 0-based
 * @param {number} props.stepCount
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {string} [props.progressAccessibilityLabel] - e.g. "Quote wizard progress"
 * @param {boolean} [props.embedded] When true, omits horizontal padding (parent scroll content provides gutter).
 */
export function WizardStepHeader({
  stepIndex,
  stepCount,
  title,
  subtitle,
  progressAccessibilityLabel = 'Wizard progress',
  embedded = false,
}) {
  const { colors } = useTheme();
  const progress =
    stepCount > 0 ? Math.min(100, Math.max(0, ((stepIndex + 1) / stepCount) * 100)) : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 16,
          paddingHorizontal: embedded ? 0 : SCREEN_GUTTER,
          paddingTop: 8,
        },
        track: {
          backgroundColor: colors.border,
          borderRadius: 2,
          height: 4,
          marginBottom: 20,
          overflow: 'hidden',
          width: '100%',
        },
        fill: {
          backgroundColor: colors.accent,
          borderRadius: 2,
          height: '100%',
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
          lineHeight: 20,
          marginTop: 2,
        },
      }),
    [colors, embedded],
  );

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel={`${progressAccessibilityLabel} ${Math.round(progress)} percent`}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
      <AppText style={styles.title}>{title}</AppText>
      {subtitle?.trim() ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
    </View>
  );
}
