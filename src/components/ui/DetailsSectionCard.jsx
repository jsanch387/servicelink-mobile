import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { SurfaceCard } from './Card';
import { useTheme } from '../../theme';

export function DetailsSectionCard({ title, children }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        section: {
          rowGap: 14,
        },
        title: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.section}>
      <AppText style={styles.title}>{title}</AppText>
      <SurfaceCard style={styles.card}>{children}</SurfaceCard>
    </View>
  );
}
