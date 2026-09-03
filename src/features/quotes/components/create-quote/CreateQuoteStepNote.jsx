import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, AppTextInput, SurfaceCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { QUOTE_NOTE_MAX } from '../../constants/createQuoteFieldLimits';

/**
 * Optional customer-facing note — label sits above a plain surface, no field outline.
 *
 * @param {object} props
 * @param {string} props.note
 * @param {(text: string) => void} props.onNoteChange
 * @param {() => void} [props.onFocus]
 */
export function CreateQuoteStepNote({ note, onNoteChange, onFocus }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          gap: 8,
        },
        title: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        input: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          letterSpacing: -0.15,
          lineHeight: 22,
          minHeight: 120,
          paddingBottom: 2,
          paddingTop: 2,
          textAlignVertical: 'top',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.section}>
      <AppText style={styles.title}>Note for customer</AppText>
      <SurfaceCard padding="none" style={styles.card}>
        <AppTextInput
          autoCapitalize="sentences"
          maxLength={QUOTE_NOTE_MAX}
          multiline
          placeholder="Add details the customer should know…"
          placeholderTextColor={colors.placeholder}
          style={styles.input}
          value={note}
          onChangeText={onNoteChange}
          onFocus={onFocus}
        />
      </SurfaceCard>
    </View>
  );
}
