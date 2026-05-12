import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  DurationSelectField,
  InlineCardError,
  SurfaceTextField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';

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

export function ServiceCreateSheet({
  visible,
  allowBackdropClose = false,
  onRequestClose,
  onSave,
  isSaving = false,
  submitError = '',
}) {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [durationHHmm, setDurationHHmm] = useState('01:00');

  useEffect(() => {
    if (!visible) return;
    setName('');
    setDescription('');
    setPrice('');
    setDurationHHmm('01:00');
  }, [visible]);

  const canSave =
    name.trim().length > 0 &&
    description.trim().length > 0 &&
    price.trim().length > 0 &&
    String(durationHHmm ?? '').trim().length > 0;

  function insertBulletPoint() {
    setDescription((current) => {
      const text = String(current ?? '');
      if (text.trim().length === 0) {
        return '• ';
      }
      const needsLineBreak = !text.endsWith('\n');
      return `${text}${needsLineBreak ? '\n' : ''}• `;
    });
  }

  async function handlePrimary() {
    if (!canSave || !onSave) return;
    await onSave({
      name: name.trim(),
      description: description.trim(),
      price,
      durationHHmm,
    });
  }

  return (
    <BottomSheetModal
      allowBackdropClose={allowBackdropClose}
      onRequestClose={onRequestClose}
      title="Add new service"
      visible={visible}
      footer={
        <View style={styles.actions}>
          <Button
            fullWidth
            labelColor="#ffffff"
            outlineColor="rgba(255,255,255,0.52)"
            style={styles.actionBtn}
            title="Cancel"
            variant="outline"
            onPress={onRequestClose}
          />
          <Button
            disabled={!canSave || isSaving}
            fullWidth
            loading={isSaving}
            style={styles.actionBtn}
            title="Save service"
            variant="surfaceLight"
            onPress={() => {
              void handlePrimary();
            }}
          />
        </View>
      }
    >
      <SurfaceTextField
        containerStyle={styles.field}
        label="Service name"
        onChangeText={setName}
        value={name}
      />
      <SurfaceTextField
        containerStyle={[styles.field, styles.descriptionField]}
        label="Description"
        multiline
        onChangeText={setDescription}
        style={styles.descriptionInput}
        textAlignVertical="top"
        value={description}
      />
      <View style={styles.descriptionToolbar}>
        <Pressable
          accessibilityLabel="Insert bullet point"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.bulletButton}
          onPress={insertBulletPoint}
        >
          <Ionicons color={colors.textMuted} name="list-outline" size={18} />
        </Pressable>
        <AppText style={[styles.charCount, { color: colors.textMuted }]}>
          {description.length}/800
        </AppText>
      </View>
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
        onValueChange={setDurationHHmm}
        triggerStyle={{ borderColor: 'rgba(255,255,255,0.24)', borderWidth: 1 }}
        value={durationHHmm}
      />

      {!name.trim() || !description.trim() ? (
        <AppText style={[styles.requiredHint, { color: colors.textMuted }]}>
          Name and description are required.
        </AppText>
      ) : null}

      {submitError ? (
        <View style={styles.submitErrorWrap}>
          <InlineCardError message={submitError} />
        </View>
      ) : null}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: 14,
  },
  descriptionField: {
    marginBottom: 4,
  },
  descriptionInput: {
    minHeight: 110,
    paddingTop: 12,
  },
  descriptionToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: -6,
  },
  bulletButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  charCount: {
    fontSize: 12,
  },
  durationField: {
    marginTop: 0,
  },
  requiredHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
  submitErrorWrap: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  actionBtn: {
    flex: 1,
  },
});
