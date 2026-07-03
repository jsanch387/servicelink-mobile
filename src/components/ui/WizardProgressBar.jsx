import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SCREEN_GUTTER } from '../../constants/layout';
import { useTheme } from '../../theme';

/**
 * Thin accent progress bar for multi-step create flows (quote, appointment, etc.).
 *
 * @param {{ progressPercent: number; bottomSpacing?: number; topSpacing?: number }} props
 */
export function WizardProgressBar({ progressPercent, bottomSpacing = 0, topSpacing = 8 }) {
  const { colors } = useTheme();
  const progress = Math.min(100, Math.max(0, progressPercent));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: bottomSpacing,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: topSpacing,
        },
        track: {
          backgroundColor: colors.border,
          borderRadius: 2,
          height: 4,
          overflow: 'hidden',
          width: '100%',
        },
        fill: {
          backgroundColor: colors.accent,
          borderRadius: 2,
          height: '100%',
        },
      }),
    [colors, bottomSpacing, topSpacing],
  );

  return (
    <View style={styles.wrap}>
      <View
        accessibilityLabel={`Wizard progress ${Math.round(progress)} percent`}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}
