import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

const ERROR_RED = '#ef4444';
const ERROR_RING = 'rgba(239, 68, 68, 0.16)';

/**
 * Full-screen error after contact submit fails — edit layout/styling here.
 *
 * @param {{ message: string; onTryAgain: () => void }} props
 */
export function SupportSubmitError({ message, onTryAgain }) {
  const { colors } = useTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.wrap}>
        <View
          accessibilityLabel="Message could not be sent"
          accessibilityRole="image"
          style={[styles.iconRing, { backgroundColor: ERROR_RING }]}
        >
          <Ionicons color={ERROR_RED} name="alert-circle" size={72} />
        </View>
        <AppText style={[styles.title, { color: colors.text }]}>Couldn’t send</AppText>
        <AppText style={[styles.body, { color: colors.textMuted }]}>
          {message.trim() || 'Something went wrong. Please try again in a moment.'}
        </AppText>
      </View>
      <View style={styles.actions}>
        <Button fullWidth title="Try again" onPress={onTryAgain} />
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
    paddingBottom: 12,
    paddingHorizontal: 8,
    paddingTop: 28,
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
