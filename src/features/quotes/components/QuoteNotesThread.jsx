import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * One note → plain text in the Notes card.
 * Both customer and shop → named thread (not a chat).
 *
 * @param {object} props
 * @param {string} [props.customerName]
 * @param {string} [props.customerNote]
 * @param {string} [props.businessName]
 * @param {string} [props.businessNote]
 * @param {import('react').ReactNode} [props.businessNoteSlot] Replaces the shop body (e.g. review input).
 */
export function QuoteNotesThread({
  customerName = '',
  customerNote = '',
  businessName = '',
  businessNote = '',
  businessNoteSlot = null,
}) {
  const { colors, isDark } = useTheme();
  const customerLabel = String(customerName ?? '').trim() || 'Customer';
  const businessLabel = String(businessName ?? '').trim() || 'Your business';
  const customerBody = String(customerNote ?? '').trim();
  const businessBody = String(businessNote ?? '').trim();
  const hasBusinessSlot = businessNoteSlot != null;
  const hasBusinessTurn = hasBusinessSlot || Boolean(businessBody);
  const isThread = Boolean(customerBody) && hasBusinessTurn;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        thread: {
          gap: 16,
          paddingVertical: 2,
        },
        turn: {
          gap: 8,
          maxWidth: '100%',
        },
        shopTurn: {
          alignItems: 'flex-end',
        },
        speaker: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: -0.05,
          lineHeight: 16,
        },
        shopSpeaker: {
          textAlign: 'right',
        },
        bubble: {
          borderRadius: 16,
          maxWidth: '92%',
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        customerBubble: {
          alignSelf: 'flex-start',
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(10,10,10,0.05)',
          borderBottomLeftRadius: 6,
        },
        shopBubble: {
          alignSelf: 'flex-end',
          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(10,10,10,0.08)',
          borderBottomRightRadius: 6,
        },
        body: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          lineHeight: 22,
        },
        shopSlot: {
          minWidth: 220,
          width: '100%',
        },
        plainBody: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
        },
      }),
    [colors, isDark],
  );

  if (!customerBody && !hasBusinessTurn) {
    return null;
  }

  if (!isThread) {
    return (
      <DetailsSectionCard bodyPadding="roomy" title="Notes">
        {customerBody ? <AppText style={styles.plainBody}>{customerBody}</AppText> : null}
        {hasBusinessTurn ? (
          hasBusinessSlot ? (
            businessNoteSlot
          ) : (
            <AppText style={styles.plainBody}>{businessBody}</AppText>
          )
        ) : null}
      </DetailsSectionCard>
    );
  }

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Notes">
      <View accessibilityLabel="Quote notes thread" style={styles.thread}>
        {customerBody ? (
          <View style={styles.turn}>
            <AppText style={styles.speaker}>{customerLabel}</AppText>
            <View style={[styles.bubble, styles.customerBubble]}>
              <AppText style={styles.body}>{customerBody}</AppText>
            </View>
          </View>
        ) : null}
        {hasBusinessTurn ? (
          <View style={[styles.turn, styles.shopTurn]}>
            <AppText style={[styles.speaker, styles.shopSpeaker]}>{businessLabel}</AppText>
            <View style={[styles.bubble, styles.shopBubble]}>
              {hasBusinessSlot ? (
                <View style={styles.shopSlot}>{businessNoteSlot}</View>
              ) : (
                <AppText style={styles.body}>{businessBody}</AppText>
              )}
            </View>
          </View>
        ) : null}
      </View>
    </DetailsSectionCard>
  );
}
