import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { Button } from './Button';
import { SurfaceCard } from './Card';
import { useTheme } from '../../theme';
import { SUBMIT_OUTCOME_SUCCESS } from './submitOutcomeTokens';

/**
 * Shared success state after async submit — card layout with optional primary action,
 * or inline layout for wizard footers.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {import('react').ReactNode} [props.body]
 * @param {import('react').ReactNode} [props.children]
 * @param {string} [props.iconAccessibilityLabel]
 * @param {{ title: string; onPress: () => void }} [props.primaryAction]
 * @param {'card' | 'inline'} [props.variant]
 */
export function SubmitOutcomeSuccess({
  title,
  body,
  children,
  iconAccessibilityLabel = 'Success',
  primaryAction,
  variant = 'card',
}) {
  const { colors } = useTheme();
  const isCard = variant === 'card';
  const iconSize = isCard ? 72 : 64;

  const content = (
    <>
      <View
        accessibilityLabel={iconAccessibilityLabel}
        accessibilityRole="image"
        style={[
          isCard ? styles.iconRing : styles.inlineIconWrap,
          isCard ? { backgroundColor: SUBMIT_OUTCOME_SUCCESS.ring } : null,
        ]}
      >
        <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="checkmark-circle" size={iconSize} />
      </View>
      <AppText style={[isCard ? styles.title : styles.inlineTitle, { color: colors.text }]}>
        {title}
      </AppText>
      {body ? (
        typeof body === 'string' ? (
          <AppText style={[isCard ? styles.body : styles.inlineBody, { color: colors.textMuted }]}>
            {body}
          </AppText>
        ) : (
          body
        )
      ) : null}
      {children}
    </>
  );

  if (!isCard) {
    return <View style={styles.inlineWrap}>{content}</View>;
  }

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.wrap}>{content}</View>
      {primaryAction ? (
        <View style={styles.actions}>
          <Button fullWidth title={primaryAction.title} onPress={primaryAction.onPress} />
        </View>
      ) : null}
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
  inlineWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    width: '100%',
  },
  inlineIconWrap: {
    marginBottom: 20,
  },
  inlineTitle: {
    alignSelf: 'stretch',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
    marginBottom: 14,
    textAlign: 'center',
  },
  inlineBody: {
    alignSelf: 'stretch',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.15,
    lineHeight: 24,
    textAlign: 'center',
  },
});
