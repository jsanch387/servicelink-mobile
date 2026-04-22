import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { SurfaceCard } from './Card';

/**
 * Section label + card shell for grouped settings rows.
 */
export function SettingsSection({ title, children, first = false }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignSelf: 'stretch',
          marginTop: first ? 0 : 22,
        },
        label: {
          alignSelf: 'flex-start',
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginBottom: 8,
        },
        card: {
          overflow: 'hidden',
        },
      }),
    [colors, first],
  );

  return (
    <View style={styles.wrap}>
      <AppText style={styles.label}>{title}</AppText>
      <SurfaceCard padding="none" style={styles.card}>
        {children}
      </SurfaceCard>
    </View>
  );
}
