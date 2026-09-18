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
 * @param {'card' | 'inline'} [props.variant]
 * @param {boolean} [props.showPrimaryAction]
 */
export function SubmitOutcomeError({
  message,
  onPrimaryAction,
  title = 'Couldn’t send',
  primaryActionTitle = 'Try again',
  iconAccessibilityLabel = 'Could not complete',
  fallbackMessage = 'Something went wrong. Please try again in a moment.',
  variant = 'card',
  showPrimaryAction = true,
}) {
  const { colors } = useTheme();
  const detail = String(message ?? '').trim() || fallbackMessage;
  const isCard = variant === 'card';
  const iconSize = isCard ? 72 : 64;

  const content = (
    <>
      <View
        accessibilityLabel={iconAccessibilityLabel}
        accessibilityRole="image"
        style={[
          isCard ? styles.iconRing : styles.inlineIconWrap,
          isCard ? { backgroundColor: SUBMIT_OUTCOME_ERROR.ring } : null,
        ]}
      >
        <Ionicons color={SUBMIT_OUTCOME_ERROR.color} name="alert-circle" size={iconSize} />
      </View>
      <AppText style={[isCard ? styles.title : styles.inlineTitle, { color: colors.text }]}>
        {title}
      </AppText>
      <AppText
        style={[
          isCard ? styles.body : styles.inlineBody,
          !showPrimaryAction && !isCard ? styles.inlineBodyFlush : null,
          { color: colors.textMuted },
        ]}
      >
        {detail}
      </AppText>
    </>
  );

  const action = showPrimaryAction ? (
    <View style={isCard ? styles.actions : styles.inlineActions}>
      <Button fullWidth title={primaryActionTitle} onPress={onPrimaryAction} />
    </View>
  ) : null;

  if (!isCard) {
    return (
      <View style={[styles.inlineWrap, !showPrimaryAction && styles.inlineWrapFlush]}>
        {content}
        {action}
      </View>
    );
  }

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.wrap}>{content}</View>
      {action}
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.35,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    maxWidth: 280,
    textAlign: 'center',
  },
  actions: {
    gap: 10,
    marginTop: 8,
    paddingBottom: 4,
  },
  inlineWrap: {
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 8,
    paddingTop: 24,
    width: '100%',
  },
  inlineWrapFlush: {
    paddingTop: 0,
  },
  inlineIconWrap: {
    marginBottom: 16,
  },
  inlineTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.35,
    marginBottom: 4,
    textAlign: 'center',
  },
  inlineBody: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 280,
    textAlign: 'center',
  },
  inlineBodyFlush: {
    marginBottom: 0,
  },
  inlineActions: {
    alignSelf: 'stretch',
    width: '100%',
  },
});
