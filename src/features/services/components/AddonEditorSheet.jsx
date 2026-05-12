import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  DurationSelectField,
  FormBottomSheetModal,
  InlineCardError,
  SurfaceTextField,
} from '../../../components/ui';

function normalizePriceInput(rawText) {
  const input = String(rawText ?? '').replace(/\$/g, '');
  let out = '';
  let dotSeen = false;
  for (const ch of input) {
    if (ch >= '0' && ch <= '9') {
      out += ch;
      continue;
    }
    if (ch === '.' && !dotSeen) {
      out += ch;
      dotSeen = true;
    }
  }
  return out;
}

/**
 * Create / edit business add-on — same tall bottom sheet shell as add service (`FormBottomSheetModal`).
 */
export function AddonEditorSheet({
  visible,
  title,
  primaryButtonTitle,
  initialName = '',
  initialPrice = '',
  initialDurationHHmm = '',
  allowBackdropClose = false,
  onRequestClose,
  onSave,
  isSaving = false,
  submitError = '',
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');

  useEffect(() => {
    if (!visible) return;
    setName(String(initialName ?? ''));
    setPrice(String(initialPrice ?? '').replace(/\$/g, ''));
    setDurationHHmm(String(initialDurationHHmm ?? ''));
  }, [visible, initialName, initialPrice, initialDurationHHmm]);

  const canSave = name.trim().length > 0 && price.trim().length > 0;

  async function handlePrimary() {
    if (!canSave || !onSave) return;
    await onSave({
      name: name.trim(),
      price,
      durationHHmm,
    });
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
      <SurfaceTextField
        containerStyle={styles.field}
        label="Name"
        onChangeText={setName}
        value={name}
      />
      <SurfaceTextField
        containerStyle={styles.field}
        keyboardType="decimal-pad"
        label="Price"
        onChangeText={(text) => setPrice(normalizePriceInput(text))}
        value={`$${price}`}
      />
      <DurationSelectField
        containerStyle={styles.durationField}
        label="Duration"
        mode="addon"
        placeholder="No extra time"
        onValueChange={setDurationHHmm}
        triggerStyle={{ borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1 }}
        value={durationHHmm}
      />

      {submitError ? (
        <View style={styles.submitErrorWrap}>
          <InlineCardError message={submitError} />
        </View>
      ) : null}
    </FormBottomSheetModal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  durationField: {
    marginTop: 0,
  },
  submitErrorWrap: {
    marginTop: 8,
  },
});
