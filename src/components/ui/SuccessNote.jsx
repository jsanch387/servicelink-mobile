import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { SUBMIT_OUTCOME_SUCCESS } from './submitOutcomeTokens';

/**
 * Optional secondary copy on success screens.
 * Prefer `variant="plain"` — flows under the title like normal body text.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.children]
 * @param {string} [props.emphasis]
 * @param {keyof typeof Ionicons.glyphMap} [props.iconName]
 * @param {'positive' | 'muted'} [props.tone]
 * @param {'plain' | 'card'} [props.variant]
 */
export function SuccessNote({
  children,
  emphasis,
  iconName = 'chatbubble-ellipses-outline',
  tone = 'positive',
  variant = 'plain',
}) {
  const { colors } = useTheme();
  const isCard = variant === 'card';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        plainWrap: {
          alignItems: 'center',
          alignSelf: 'center',
          gap: 4,
          marginTop: 14,
          maxWidth: 320,
          width: '100%',
        },
        cardWrap: {
          alignItems: 'center',
          alignSelf: 'center',
          borderRadius: 14,
          gap: 8,
          maxWidth: 280,
          paddingHorizontal: 16,
          paddingVertical: 14,
          width: '100%',
        },
        positiveCard: {
          backgroundColor: 'rgba(34, 197, 94, 0.14)',
          borderColor: 'rgba(34, 197, 94, 0.28)',
          borderWidth: 1,
        },
        mutedCard: {
          backgroundColor: colors.buttonGhostPressed,
          borderColor: colors.border,
          borderWidth: 1,
        },
        text: {
          alignSelf: 'stretch',
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          textAlign: 'center',
          width: '100%',
        },
        plainText: {
          color: colors.textMuted,
        },
        cardText: {
          color: colors.textMuted,
        },
        emphasis: {
          alignSelf: 'stretch',
          color: tone === 'positive' ? SUBMIT_OUTCOME_SUCCESS.color : colors.text,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 22,
          textAlign: 'center',
          width: '100%',
        },
      }),
    [colors, tone],
  );

  const wrapStyle = [
    isCard ? styles.cardWrap : styles.plainWrap,
    isCard && (tone === 'positive' ? styles.positiveCard : styles.mutedCard),
  ];

  const iconColor = tone === 'positive' ? SUBMIT_OUTCOME_SUCCESS.color : colors.textMuted;

  return (
    <View style={wrapStyle}>
      {isCard ? <Ionicons color={iconColor} name={iconName} size={20} /> : null}
      {children != null ? (
        <AppText style={[styles.text, isCard ? styles.cardText : styles.plainText]}>
          {children}
        </AppText>
      ) : null}
      {emphasis ? <AppText style={styles.emphasis}>{emphasis}</AppText> : null}
    </View>
  );
}
