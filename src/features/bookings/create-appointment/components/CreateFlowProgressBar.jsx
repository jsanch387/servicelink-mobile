import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../../theme';

/**
 * Thin accent bar showing wizard progress (0–100).
 *
 * @param {{ progressPercent: number }} props
 */
export function CreateFlowProgressBar({ progressPercent }) {
  const { colors } = useTheme();
  const p = Math.min(100, Math.max(0, progressPercent));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 12,
          paddingTop: 0,
        },
        track: {
          backgroundColor: colors.border,
          height: 4,
          overflow: 'hidden',
          width: '100%',
        },
        fill: {
          backgroundColor: colors.accent,
          height: '100%',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View accessibilityLabel="Progress" style={styles.track}>
        <View style={[styles.fill, { width: `${p}%` }]} />
      </View>
    </View>
  );
}
