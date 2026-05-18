import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

const SUCCESS_GREEN = '#22c55e';
const SUCCESS_RING = 'rgba(34, 197, 94, 0.18)';

/**
 * Success state after contact form submit — edit layout/styling here.
 *
 * @param {{ onDone: () => void }} props
 */
export function SupportSubmitConfirm({ onDone }) {
  const { colors } = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.wrap}>
        <View
          accessibilityLabel="Message sent"
          accessibilityRole="image"
          style={[styles.iconRing, { backgroundColor: SUCCESS_RING }]}
        >
          <Ionicons color={SUCCESS_GREEN} name="checkmark-circle" size={72} />
        </View>
        <AppText style={[styles.title, { color: colors.text }]}>Message sent</AppText>
        <AppText style={[styles.body, { color: colors.textMuted }]}>
          Thanks for reaching out. We usually respond within 24 hours.
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button fullWidth title="Done" onPress={onDone} />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    minHeight: 320,
  },
  wrap: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingTop: 28,
    paddingBottom: 12,
  },
  iconRing: {
    alignItems: 'center',
    borderRadius: 999,
    height: 104,
    justifyContent: 'center',
    marginBottom: 4,
    width: 104,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
    marginTop: 8,
    paddingBottom: 4,
  },
});
