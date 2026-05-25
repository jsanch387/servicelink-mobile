import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * @param {object} props
 * @param {number} props.stepIndex
 * @param {number} props.stepCount
 * @param {string} props.title
 * @param {string} props.subtitle
 */
export function MaintenanceInviteWizardHeader({ stepIndex, stepCount, title, subtitle }) {
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
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginBottom: 16,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 22,
          fontWeight: '600',
          letterSpacing: -0.35,
          lineHeight: 28,
          marginBottom: 5,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 21,
        },
      }),
    [colors],
  );

  const label = `Step ${stepIndex + 1} of ${stepCount}`;

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel={`Maintenance offer progress ${Math.round(progress)} percent`}
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
