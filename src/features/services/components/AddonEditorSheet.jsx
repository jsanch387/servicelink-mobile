import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  DurationSelectField,
  FormBottomSheetModal,
  InlineCardError,
  SurfaceTextField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { ADDON_DESCRIPTION_MAX_LENGTH } from '../constants/addonDescriptionLimits';

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

function RequiredFieldLabel({ colors, text }) {
  return (
    <View style={styles.requiredLabelRow}>
      <AppText style={[styles.requiredLabelBase, { color: colors.textMuted }]}>{text}</AppText>
      <AppText style={[styles.requiredLabelBase, { color: colors.danger }]}> *</AppText>
    </View>
  );
}

function OptionalFieldLabel({ colors, text }) {
  return (
    <View style={styles.requiredLabelRow}>
      <AppText style={[styles.requiredLabelBase, { color: colors.textMuted }]}>{text}</AppText>
    </View>
  );
}

/**
 * Create / edit add-on or pricing option — tall bottom sheet shell (`FormBottomSheetModal`).
 * Use `durationMode="service"` for full service durations (pricing options); default `addon` for extra time.
 * Short description is add-on only (hidden for pricing options).
 */
export function AddonEditorSheet({
  visible,
  title,
  primaryButtonTitle,
  initialName = '',
  initialPrice = '',
  initialDurationHHmm = '',
  initialDescription = '',
  /** Passed to `DurationSelectField`: `'addon'` = optional extra time; `'service'` = full service duration. */
  durationMode = 'addon',
  durationPlaceholder = 'No extra time',
  allowBackdropClose = false,
  onRequestClose,
  onSave,
  isSaving = false,
  submitError = '',
}) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('');
  const [description, setDescription] = useState('');

  const showDescription = durationMode === 'addon';

  useEffect(() => {
    if (!visible) return;
    setName(String(initialName ?? ''));
    setPrice(String(initialPrice ?? '').replace(/\$/g, ''));
    setDurationHHmm(String(initialDurationHHmm ?? ''));
    setDescription(String(initialDescription ?? '').slice(0, ADDON_DESCRIPTION_MAX_LENGTH));
  }, [visible, initialName, initialPrice, initialDurationHHmm, initialDescription]);

  const durationRequired = durationMode === 'service';

  const canSave =
    name.trim().length > 0 &&
    price.trim().length > 0 &&
    (!durationRequired || String(durationHHmm ?? '').trim().length > 0);

  async function handlePrimary() {
    if (!canSave || !onSave) return;
    await onSave({
      name: name.trim(),
      price,
      durationHHmm,
      description: showDescription ? description.trim() : '',
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
      <View style={styles.fieldWrap}>
        <RequiredFieldLabel colors={colors} text="Name" />
        <SurfaceTextField
          containerStyle={styles.fieldBody}
          label={null}
          onChangeText={setName}
          value={name}
        />
      </View>
      <View style={styles.fieldWrap}>
        <RequiredFieldLabel colors={colors} text="Price" />
        <SurfaceTextField
          containerStyle={styles.fieldBody}
          keyboardType="decimal-pad"
          label={null}
          onChangeText={(text) => setPrice(normalizePriceInput(text))}
          value={`$${price}`}
        />
      </View>
      <View style={styles.fieldWrap}>
        {durationRequired ? (
          <RequiredFieldLabel colors={colors} text="Duration" />
        ) : (
          <OptionalFieldLabel colors={colors} text="Duration" />
        )}
        <DurationSelectField
          containerStyle={styles.durationField}
          label={null}
          mode={durationMode}
          placeholder={durationPlaceholder}
          onValueChange={setDurationHHmm}
          triggerStyle={{ borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1 }}
          value={durationHHmm}
        />
      </View>
      {showDescription ? (
        <View style={styles.fieldWrap}>
          <OptionalFieldLabel colors={colors} text="Description" />
          <SurfaceTextField
            containerStyle={styles.fieldBody}
            label={null}
            maxLength={ADDON_DESCRIPTION_MAX_LENGTH}
            multiline
            onChangeText={setDescription}
            placeholder="Optional short description"
            style={styles.descriptionInput}
            textAlignVertical="top"
            value={description}
          />
          {description.length > 0 ? (
            <AppText style={[styles.charCount, { color: colors.textMuted }]}>
              {description.length}/{ADDON_DESCRIPTION_MAX_LENGTH}
            </AppText>
          ) : null}
        </View>
      ) : null}

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
  durationField: {
    marginBottom: 0,
    marginTop: 0,
  },
  descriptionInput: {
    minHeight: 88,
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
  },
  submitErrorWrap: {
    marginTop: 8,
  },
});
