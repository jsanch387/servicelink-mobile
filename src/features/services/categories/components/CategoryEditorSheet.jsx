import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  FormBottomSheetModal,
  InlineCardError,
  SurfaceTextField,
} from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function RequiredFieldLabel({ colors, text }) {
  return (
    <View style={styles.requiredLabelRow}>
      <AppText style={[styles.requiredLabelBase, { color: colors.textMuted }]}>{text}</AppText>
      <AppText style={[styles.requiredLabelBase, { color: colors.danger }]}> *</AppText>
    </View>
  );
}

export function CategoryEditorSheet({
  visible,
  title,
  primaryButtonTitle,
  initialName = '',
  allowBackdropClose = false,
  onRequestClose,
  onSave,
  isSaving = false,
  submitError = '',
}) {
  const { colors } = useTheme();
  const [name, setName] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(String(initialName ?? ''));
  }, [visible, initialName]);

  const canSave = name.trim().length > 0;

  async function handlePrimary() {
    if (!canSave || !onSave) return;
    await onSave({ name: name.trim() });
  }

  return (
    <FormBottomSheetModal
      allowBackdropClose={allowBackdropClose}
      primaryDisabled={!canSave || isSaving}
      primaryLoading={isSaving}
      primaryTitle={primaryButtonTitle}
      title={title}
      visible={visible}
      onPrimaryPress={handlePrimary}
      onRequestClose={onRequestClose}
    >
      <View style={styles.fieldWrap}>
        <RequiredFieldLabel colors={colors} text="Name" />
        <SurfaceTextField
          containerStyle={styles.fieldBody}
          label={null}
          onChangeText={setName}
          value={name}
        />
      </View>

      {submitError ? (
        <View style={styles.submitErrorWrap}>
          <InlineCardError message={submitError} />
        </View>
      ) : null}
    </FormBottomSheetModal>
  );
}

const styles = StyleSheet.create({
  requiredLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
  },
  requiredLabelBase: {
    fontSize: 14,
    fontWeight: '500',
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldBody: {
    marginBottom: 0,
  },
  submitErrorWrap: {
    marginTop: 8,
  },
});
