import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, WizardProgressBar } from '../../../../components/ui';
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
        },
        copy: {
          paddingHorizontal: SCREEN_GUTTER,
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

  return (
    <View style={styles.wrap}>
      <WizardProgressBar bottomSpacing={22} progressPercent={progress} />
      <View style={styles.copy}>
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>{subtitle}</AppText>
      </View>
    </View>
  );
}
