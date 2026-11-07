import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  BottomSheetModal,
  Button,
  InlineCardError,
  SurfaceTextField,
} from '../../../components/ui';
import {
  TEAM_INVITE_INVALID_NAME,
  TEAM_INVITE_NAME_PLACEHOLDER,
  TEAM_ROLE_SAVE_BUTTON,
} from '../constants/teamMembersCopy';

/**
 * Edit a teammate's display name. Closing discards the draft.
 */
export function TeamNameSheet({
  visible,
  value,
  saving = false,
  errorMessage = null,
  onRequestClose,
  onSave,
}) {
  const stored = String(value ?? '').trim();
  const [draft, setDraft] = useState(stored);
  const [localError, setLocalError] = useState(null);
  const trimmed = draft.trim();
  const unchanged = trimmed === stored;

  useEffect(() => {
    if (visible) {
      setDraft(stored);
      setLocalError(null);
    }
  }, [stored, visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        errorWrap: {
          marginBottom: 12,
        },
        footer: {
          paddingTop: 4,
        },
      }),
    [],
  );

  const save = () => {
    if (!trimmed) {
      setLocalError(TEAM_INVITE_INVALID_NAME);
      return;
    }
    if (unchanged) {
      onRequestClose();
      return;
    }
    onSave(trimmed);
  };

  return (
    <BottomSheetModal
      allowBackdropClose={!saving}
      footer={
        <View style={styles.footer}>
          <Button
            disabled={saving || unchanged}
            fullWidth
            loading={saving}
            title={TEAM_ROLE_SAVE_BUTTON}
            onPress={save}
          />
        </View>
      }
      showCloseButton={!saving}
      title="Name"
      visible={visible}
      onRequestClose={saving ? () => {} : onRequestClose}
    >
      {errorMessage ? (
        <View style={styles.errorWrap}>
          <InlineCardError message={errorMessage} />
        </View>
      ) : null}
      <SurfaceTextField
        autoCapitalize="words"
        autoCorrect={false}
        autoFocus
        compact
        errorText={localError ?? undefined}
        maxLength={80}
        placeholder={TEAM_INVITE_NAME_PLACEHOLDER}
        value={draft}
        onChangeText={(next) => {
          setDraft(next);
          if (localError) setLocalError(null);
        }}
        onSubmitEditing={save}
      />
    </BottomSheetModal>
  );
}
