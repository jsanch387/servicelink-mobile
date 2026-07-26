import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  AppTextInput,
  BottomSheetModal,
  Button,
  normalizeCustomJobPriceInput,
  SurfaceCard,
} from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { parseRequiredCustomJobPriceCents } from '../utils/createAppointmentValidators';

/**
 * Full sheet to change the job price — large centered amount entry.
 * Keyboard overlays; Done stays sticky at the bottom.
 *
 * @param {{
 *   visible: boolean;
 *   initialUsdText: string;
 *   onClose: () => void;
 *   onSave: (usdText: string) => void;
 * }} props
 */
export function EditJobPriceSheet({ visible, initialUsdText, onClose, onSave }) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState(initialUsdText);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft(initialUsdText);
    setTouched(false);
  }, [visible, initialUsdText]);

  const parsed = parseRequiredCustomJobPriceCents(draft);
  const errorText =
    touched && draft.trim().length > 0 && parsed == null
      ? 'Enter a price greater than $0.'
      : undefined;
  const canSave = parsed != null;
  const showPlaceholder = draft.trim().length === 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingHorizontal: 4,
          paddingTop: 8,
          width: '100%',
        },
        amountCard: {
          alignItems: 'center',
          borderRadius: 22,
          justifyContent: 'center',
          minHeight: 168,
          paddingHorizontal: 28,
          paddingVertical: 44,
          width: '100%',
        },
        eyebrow: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.2,
          marginBottom: 18,
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        amountRow: {
          alignItems: 'center',
          alignSelf: 'center',
          flexDirection: 'row',
          justifyContent: 'center',
        },
        dollar: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 56,
          fontWeight: '700',
          letterSpacing: -1.8,
          lineHeight: 64,
          marginRight: 2,
        },
        amountInput: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 56,
          fontWeight: '700',
          letterSpacing: -1.8,
          lineHeight: 64,
          minWidth: 28,
          padding: 0,
          textAlign: 'left',
        },
        error: {
          color: colors.danger,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 16,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      allowBackdropClose
      liftFooterWithKeyboard={false}
      sheetHeightPercent={92}
      stickyFooter
      title="Edit price"
      visible={visible}
      onRequestClose={onClose}
      footer={
        <Button
          disabled={!canSave}
          fullWidth
          title="Done"
          variant="primary"
          onPress={() => {
            if (!canSave) {
              setTouched(true);
              return;
            }
            onSave(String(draft).trim());
            onClose();
          }}
        />
      }
    >
      <View style={styles.wrap}>
        <SurfaceCard padding="none" style={styles.amountCard}>
          <AppText style={styles.eyebrow}>New amount</AppText>
          <View style={styles.amountRow}>
            <AppText style={styles.dollar}>$</AppText>
            <AppTextInput
              autoFocus
              caretHidden={false}
              keyboardType="decimal-pad"
              maxLength={10}
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              selectionColor={colors.text}
              style={[
                styles.amountInput,
                { minWidth: Math.max(showPlaceholder ? 44 : 28, draft.length * 32) },
              ]}
              value={draft}
              onChangeText={(value) => {
                setTouched(true);
                setDraft(normalizeCustomJobPriceInput(value, 10));
              }}
            />
          </View>
          {errorText ? <AppText style={styles.error}>{errorText}</AppText> : null}
        </SurfaceCard>
      </View>
    </BottomSheetModal>
  );
}
