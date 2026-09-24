import { useMemo } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { SCREEN_GUTTER } from '../../constants/layout';
import { useTheme } from '../../theme';

/**
 * Shared wizard header: progress bar, title, and subtitle (no step count).
 * Tapping the header dismisses the keyboard (helps iOS number/phone pads).
 *
 * @param {object} props
 * @param {number} props.stepIndex - 0-based
 * @param {number} props.stepCount
 * @param {string} props.title
 * @param {string} props.subtitle
 * @param {string} [props.progressAccessibilityLabel] - e.g. "Quote wizard progress"
 * @param {boolean} [props.embedded] When true, omits horizontal padding (parent scroll content provides gutter).
 * @param {boolean} [props.showProgress] When false, title/subtitle only (e.g. edit section screens).
 * @param {boolean} [props.compactCopy] Tighter title + subtitle grouping.
 */
export function WizardStepHeader({
  stepIndex,
  stepCount,
  title,
  subtitle,
  progressAccessibilityLabel = 'Wizard progress',
  embedded = false,
  showProgress = true,
  compactCopy = false,
  style,
}) {
  const { colors } = useTheme();
  const titleText = String(title ?? '').trim();
  const subtitleText = String(subtitle ?? '').trim();
  const hasCopy = Boolean(titleText || subtitleText);
  const progress =
    stepCount > 0 ? Math.min(100, Math.max(0, ((stepIndex + 1) / stepCount) * 100)) : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: hasCopy ? 14 : 20,
          paddingHorizontal: embedded ? 0 : SCREEN_GUTTER,
          paddingTop: showProgress ? 8 : 0,
        },
        track: {
          backgroundColor: colors.border,
          borderRadius: 2,
          height: 4,
          marginBottom: hasCopy ? 18 : 0,
          overflow: 'hidden',
          width: '100%',
        },
        fill: {
          backgroundColor: colors.accent,
          borderRadius: 2,
          height: '100%',
        },
        copy: {
          gap: 2,
        },
        title: {
          color: colors.text,
          fontSize: 26,
          fontWeight: '700',
          letterSpacing: -0.6,
          lineHeight: 28,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: compactCopy ? 14 : 15,
          fontWeight: '400',
          lineHeight: compactCopy ? 19 : 20,
        },
      }),
    [colors, compactCopy, embedded, hasCopy, showProgress],
  );

  return (
    <Pressable
      // Keep children as separate a11y/text nodes for Maestro (default Pressable merges them).
      accessible={false}
      style={[styles.wrap, style]}
      testID="wizard-step-header"
      onPress={Keyboard.dismiss}
    >
      {showProgress ? (
        <View
          accessibilityLabel={`${progressAccessibilityLabel} ${Math.round(progress)} percent`}
          style={styles.track}
        >
          <View style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      ) : null}
      {hasCopy ? (
        <View style={styles.copy}>
          {titleText ? (
            <AppText accessibilityRole="header" style={styles.title}>
              {titleText}
            </AppText>
          ) : null}
          {subtitleText ? <AppText style={styles.subtitle}>{subtitleText}</AppText> : null}
        </View>
      ) : null}
    </Pressable>
  );
}
