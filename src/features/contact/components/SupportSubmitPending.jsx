import { StyleSheet, View } from 'react-native';
import { AppText, EchoBarsLoader, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Shown while POST /api/contact is in flight.
 */
export function SupportSubmitPending() {
  const { colors } = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.wrap}>
        <EchoBarsLoader accessibilityLabel="Sending message" />
        <AppText style={[styles.title, { color: colors.text }]}>Sending</AppText>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 200,
    justifyContent: 'center',
  },
  wrap: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.25,
    textAlign: 'center',
  },
});
