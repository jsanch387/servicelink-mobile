import { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, SpotlightCard } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { CREATE_PAYMENT_PAGE_PAD_TOP } from '../constants';
import { CREATE_PAYMENT_NOTE_MAX_LENGTH } from '../utils/createPaymentAmount';
import { CreatePaymentAmountHero } from './CreatePaymentAmountHero';

/**
 * Tap to pay / payment-link amount stage: inverted amount card + required note.
 */
export function CreatePaymentAmountCard({
  eyebrow,
  hint,
  amount,
  note,
  onAmountChange,
  onNoteChange,
  action,
  footerPadding,
  testID,
  children,
}) {
  const { colors } = useTheme();
  const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        keyboard: {
          flex: 1,
        },
        scroll: {
          flexGrow: 1,
          justifyContent: 'flex-start',
          paddingBottom: footerPadding,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: CREATE_PAYMENT_PAGE_PAD_TOP,
        },
        card: {
          paddingHorizontal: 20,
          paddingVertical: 22,
        },
        eyebrow: {
          color: colors.nextUpTextMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          letterSpacing: 0.4,
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        noteField: {
          backgroundColor: lightFace ? '#f0f0f0' : 'rgba(255,255,255,0.10)',
          borderRadius: 14,
          marginBottom: 22,
          marginTop: 8,
          width: '100%',
        },
        note: {
          color: colors.nextUpText,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 16,
          letterSpacing: -0.2,
          paddingHorizontal: 16,
          paddingVertical: Platform.select({ ios: 14, android: 12 }),
          textAlign: 'center',
          width: '100%',
        },
        hint: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          lineHeight: 20,
          marginTop: 16,
          textAlign: 'center',
        },
      }),
    [colors, footerPadding, lightFace],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        testID={testID}
      >
        <SpotlightCard style={styles.card}>
          <AppText style={styles.eyebrow}>{eyebrow}</AppText>
          <CreatePaymentAmountHero
            bold
            compact
            placeholderTextColor={colors.nextUpTextMuted}
            selectionColor={colors.nextUpText}
            textColor={colors.nextUpText}
            value={amount}
            onChangeText={onAmountChange}
          />
          <View style={styles.noteField}>
            <AppTextInput
              autoCapitalize="sentences"
              maxLength={CREATE_PAYMENT_NOTE_MAX_LENGTH}
              placeholder="What's it for"
              placeholderTextColor={colors.nextUpTextMuted}
              selectionColor={colors.nextUpText}
              style={styles.note}
              testID="create-payment-note"
              value={note}
              onChangeText={onNoteChange}
            />
          </View>
          {action}
        </SpotlightCard>
        {hint ? <AppText style={styles.hint}>{hint}</AppText> : null}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function useCreatePaymentCardActionVariant() {
  const { colors } = useTheme();
  const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
  return lightFace ? 'surfaceDark' : 'surfaceLight';
}
