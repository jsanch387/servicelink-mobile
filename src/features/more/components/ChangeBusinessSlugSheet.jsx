import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  AppTextInput,
  BottomSheetModal,
  Button,
  InlineCardError,
  useSurfaceInputTextStyle,
} from '../../../components/ui';
import { BOOKING_LINK_HOST } from '../../home/utils/bookingLink';
import { MAX_BUSINESS_SLUG_LEN } from '../utils/businessSlug';
import { useTheme } from '../../../theme';

/**
 * Bottom sheet to edit `business_profiles.business_slug` (path only; host is fixed).
 */
export function ChangeBusinessSlugSheet({
  visible,
  onRequestClose,
  initialSlug,
  isSaving,
  saveError,
  onClearSaveError,
  onSave,
}) {
  const { colors } = useTheme();
  const inputTextStyle = useSurfaceInputTextStyle();
  const [draft, setDraft] = useState(initialSlug);

  useEffect(() => {
    if (!visible) return;
    setDraft(initialSlug);
    onClearSaveError?.();
  }, [visible, initialSlug, onClearSaveError]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        helperLine: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 14,
        },
        slugCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 18,
          borderWidth: 1,
          overflow: 'hidden',
        },
        hostRow: {
          borderBottomColor: colors.border,
          borderBottomWidth: 1,
          paddingHorizontal: 18,
          paddingVertical: 14,
        },
        hostText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        slugRow: {
          paddingHorizontal: 18,
          paddingVertical: 12,
        },
        slugInput: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: 0.2,
          minHeight: 40,
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        footer: {
          gap: 12,
          marginTop: 8,
          paddingTop: 8,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        rowGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  const footer = (
    <View style={styles.footer}>
      {saveError ? <InlineCardError message={saveError} /> : null}
      <View style={styles.row}>
        <View style={styles.rowGrow}>
          <Button fullWidth title="Cancel" variant="secondary" onPress={onRequestClose} />
        </View>
        <View style={styles.rowGrow}>
          <Button
            disabled={isSaving}
            fullWidth
            loading={isSaving}
            title="Save"
            variant="surfaceLight"
            onPress={() => {
              void onSave(draft);
            }}
          />
        </View>
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      disableKeyboardAvoiding
      footer={footer}
      maxHeight="94%"
      minHeight="84%"
      title="Change your link"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <AppText style={styles.helperLine}>
        Your old URL will stop working. Choose a new one, then save.
      </AppText>
      <View style={styles.slugCard}>
        <View style={styles.hostRow}>
          <AppText style={styles.hostText}>{`${BOOKING_LINK_HOST}/`}</AppText>
        </View>
        <View style={styles.slugRow}>
          <AppTextInput
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={MAX_BUSINESS_SLUG_LEN}
            placeholder="your-business-name"
            placeholderTextColor={colors.placeholder}
            returnKeyType="done"
            style={[inputTextStyle, styles.slugInput]}
            value={draft}
            onChangeText={setDraft}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
}
