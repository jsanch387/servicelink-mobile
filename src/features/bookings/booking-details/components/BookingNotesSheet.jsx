import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  InlineCardError,
  SurfaceTextField,
} from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { BOOKING_NOTES_MAX_LENGTH } from '../api/updateBookingNotes';

/**
 * Visit notes. Existing notes open for reading; Edit switches to the field.
 * An empty visit opens ready to type.
 *
 * @param {{
 *   visible: boolean;
 *   notes?: string;
 *   saving?: boolean;
 *   errorMessage?: string | null;
 *   onRequestClose: () => void;
 *   onSave: (notes: string) => void;
 * }} props
 */
export function BookingNotesSheet({
  visible,
  notes = '',
  saving = false,
  errorMessage = null,
  onRequestClose,
  onSave,
}) {
  const { colors } = useTheme();
  const stored = String(notes ?? '').trim();
  const [draft, setDraft] = useState(stored);
  const [editing, setEditing] = useState(stored.length === 0);
  const wasVisible = useRef(false);
  const trimmed = draft.trim();
  const unchanged = trimmed === stored;

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setDraft(stored);
      setEditing(stored.length === 0);
    }
    wasVisible.current = visible;
  }, [stored, visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        errorWrap: {
          marginBottom: 12,
        },
        body: {
          color: colors.text,
          fontSize: 16,
          letterSpacing: -0.2,
          lineHeight: 24,
        },
        input: {
          minHeight: 140,
        },
        footer: {
          paddingTop: 4,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
        },
        actionCell: {
          flex: 1,
        },
      }),
    [colors],
  );

  const save = () => {
    if (unchanged || saving) {
      if (unchanged) onRequestClose();
      return;
    }
    onSave(trimmed);
  };

  const cancelEdit = () => {
    if (saving) return;
    setDraft(stored);
    setEditing(false);
  };

  const footer = editing ? (
    stored ? (
      <View style={styles.actions}>
        <View style={styles.actionCell}>
          <Button
            disabled={saving}
            fullWidth
            title="Cancel"
            variant="secondary"
            onPress={cancelEdit}
          />
        </View>
        <View style={styles.actionCell}>
          <Button
            disabled={saving || unchanged}
            fullWidth
            loading={saving}
            title="Save"
            onPress={save}
          />
        </View>
      </View>
    ) : (
      <Button
        disabled={saving || unchanged}
        fullWidth
        loading={saving}
        title="Save"
        onPress={save}
      />
    )
  ) : (
    <Button fullWidth title="Edit" variant="secondary" onPress={() => setEditing(true)} />
  );

  return (
    <BottomSheetModal
      allowBackdropClose={!saving}
      footer={<View style={styles.footer}>{footer}</View>}
      showCloseButton={!saving}
      stickyFooter
      title="Notes"
      visible={visible}
      onRequestClose={saving ? () => {} : onRequestClose}
    >
      {errorMessage ? (
        <View style={styles.errorWrap}>
          <InlineCardError message={errorMessage} />
        </View>
      ) : null}
      {editing ? (
        <SurfaceTextField
          autoCapitalize="sentences"
          autoFocus
          compact
          maxLength={BOOKING_NOTES_MAX_LENGTH}
          multiline
          placeholder="Add notes for this visit."
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
        />
      ) : (
        <AppText selectable style={styles.body}>
          {stored}
        </AppText>
      )}
    </BottomSheetModal>
  );
}
