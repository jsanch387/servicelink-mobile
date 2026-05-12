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
import { useTheme } from '../../../theme';

export function DeleteAccountConfirmSheet({
  visible,
  expectedEmail,
  isDeleting = false,
  deleteError = null,
  onClearDeleteError,
  onRequestClose,
  onConfirm,
}) {
  const { colors } = useTheme();
  const inputTextStyle = useSurfaceInputTextStyle();
  const [typedEmail, setTypedEmail] = useState('');

  useEffect(() => {
    if (!visible) return;
    setTypedEmail('');
    onClearDeleteError?.();
  }, [visible, onClearDeleteError]);

  const normalizedExpectedEmail = (expectedEmail ?? '').trim().toLowerCase();
  const normalizedTypedEmail = typedEmail.trim().toLowerCase();
  const isMatch =
    Boolean(normalizedExpectedEmail) && normalizedTypedEmail === normalizedExpectedEmail;

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
        warningLine: {
          color: colors.danger,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 20,
          marginBottom: 14,
        },
        emailCard: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 18,
          borderWidth: 1,
          overflow: 'hidden',
          paddingHorizontal: 18,
          paddingVertical: 14,
        },
        expectedLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 6,
        },
        expectedEmail: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          marginBottom: 12,
        },
        input: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          minHeight: 40,
          paddingHorizontal: 0,
          paddingVertical: 0,
        },
        mismatchHint: {
          color: colors.textMuted,
          fontSize: 12,
          marginTop: 10,
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
      {deleteError ? <InlineCardError message={deleteError} /> : null}
      <View style={styles.row}>
        <View style={styles.rowGrow}>
          <Button
            disabled={isDeleting}
            fullWidth
            title="Cancel"
            variant="secondary"
            onPress={onRequestClose}
          />
        </View>
        <View style={styles.rowGrow}>
          <Button
            disabled={!isMatch || isDeleting}
            fullWidth
            labelColor={colors.danger}
            loading={isDeleting}
            outlineBgPressed="rgba(220, 38, 38, 0.08)"
            outlineColor={colors.danger}
            title="Delete account"
            variant="outline"
            onPress={() => {
              void onConfirm(typedEmail.trim());
            }}
          />
        </View>
      </View>
    </View>
  );

  return (
    <BottomSheetModal
      footer={footer}
      sheetHeightPercent={92}
      title="Confirm your email"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <AppText style={styles.warningLine}>This action is permanent and cannot be undone.</AppText>
      <AppText style={styles.helperLine}>
        To continue, type your account email exactly as shown below.
      </AppText>
      <View style={styles.emailCard}>
        <AppText style={styles.expectedLabel}>Account email</AppText>
        <AppText selectable style={styles.expectedEmail}>
          {expectedEmail || 'No email found'}
        </AppText>
        <AppTextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Type your email to confirm"
          placeholderTextColor={colors.placeholder}
          returnKeyType="done"
          style={[inputTextStyle, styles.input]}
          value={typedEmail}
          onChangeText={setTypedEmail}
        />
        {!isMatch && typedEmail.trim().length > 0 ? (
          <AppText style={styles.mismatchHint}>Entered email does not match.</AppText>
        ) : null}
      </View>
    </BottomSheetModal>
  );
}
