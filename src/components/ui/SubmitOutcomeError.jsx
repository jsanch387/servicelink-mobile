import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { SurfaceCard } from './Card';
import { useTheme } from '../../theme';
import { SUBMIT_OUTCOME_ERROR } from './submitOutcomeTokens';

/**
 * Shared error state after async submit fails.
 *
 * @param {object} props
 * @param {string} props.message
 * @param {() => void} props.onPrimaryAction
 * @param {string} [props.title]
 * @param {string} [props.primaryActionTitle]
 * @param {string} [props.iconAccessibilityLabel]
 * @param {string} [props.fallbackMessage]
 */
export function SubmitOutcomeError({
  message,
  onPrimaryAction,
  title = 'Couldn’t send',
  primaryActionTitle = 'Try again',
  iconAccessibilityLabel = 'Could not complete',
  fallbackMessage = 'Something went wrong. Please try again in a moment.',
}) {
  const { colors } = useTheme();
  const detail = String(message ?? '').trim() || fallbackMessage;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.wrap}>
        <View
          accessibilityLabel={iconAccessibilityLabel}
          accessibilityRole="image"
          style={[styles.iconRing, { backgroundColor: SUBMIT_OUTCOME_ERROR.ring }]}
        >
          <Ionicons color={SUBMIT_OUTCOME_ERROR.color} name="alert-circle" size={72} />
        </View>
        <AppText style={[styles.title, { color: colors.text }]}>{title}</AppText>
        <AppText style={[styles.body, { color: colors.textMuted }]}>{detail}</AppText>
      </View>
      <View style={styles.actions}>
        <Button fullWidth title={primaryActionTitle} onPress={onPrimaryAction} />
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
