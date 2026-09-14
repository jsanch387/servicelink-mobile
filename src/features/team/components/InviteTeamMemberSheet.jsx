import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button, SurfaceEmailField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { isValidEmailFormat } from '../../../utils/email';
import {
  TEAM_INVITE_EMAIL_PLACEHOLDER,
  TEAM_INVITE_INVALID_EMAIL,
  TEAM_INVITE_SEND_BUTTON,
  TEAM_INVITE_SHEET_BODY,
  TEAM_INVITE_SHEET_TITLE,
} from '../constants/teamMembersCopy';

/**
 * Invite sheet — email only, same fields as web. Caller owns send / close.
 */
export function InviteTeamMemberSheet({ visible, isSending = false, onRequestClose, onInvite }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setEmail('');
    setError(null);
  }, [visible]);

  const canSend = isValidEmailFormat(email) && !isSending;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 16,
        },
        footer: {
          minHeight: 52,
        },
      }),
    [colors],
  );

  async function handleSend() {
    if (!canSend) {
      setError(TEAM_INVITE_INVALID_EMAIL);
      return;
    }
    setError(null);
    const result = await onInvite?.(email);
    if (result && result.ok === false) {
      setError(result.error || TEAM_INVITE_INVALID_EMAIL);
    }
  }

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <Button
            accessibilityLabel={TEAM_INVITE_SEND_BUTTON}
            disabled={!canSend}
            fullWidth
            loading={isSending}
            title={TEAM_INVITE_SEND_BUTTON}
            variant="surfaceLight"
            onPress={() => {
              void handleSend();
            }}
          />
        </View>
      }
      title={TEAM_INVITE_SHEET_TITLE}
      visible={visible}
      onRequestClose={() => {
        if (isSending) return;
        onRequestClose?.();
      }}
    >
      <AppText style={styles.body}>{TEAM_INVITE_SHEET_BODY}</AppText>
      <SurfaceEmailField
        autoFocus
        errorText={error ?? undefined}
        label="Email"
        placeholder={TEAM_INVITE_EMAIL_PLACEHOLDER}
        returnKeyType="done"
        value={email}
        onChangeText={(next) => {
          setEmail(next);
          if (error) setError(null);
        }}
        onSubmitEditing={() => {
          void handleSend();
        }}
      />
    </BottomSheetModal>
  );
}
