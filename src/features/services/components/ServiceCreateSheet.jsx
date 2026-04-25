import { useEffect, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, DurationSelectField, SurfaceTextField } from '../../../components/ui';
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
  const insets = useSafeAreaInsets();
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

  function closeFromBackdrop() {
    if (!allowBackdropClose) return;
    onRequestClose?.();
  }

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
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.modalRoot}
      >
        <Pressable
          accessibilityRole="button"
          onPress={closeFromBackdrop}
          style={styles.sheetBackdrop}
        />
        <View
          style={[
            styles.sheetWrap,
            {
              backgroundColor: colors.shellElevated,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppText style={[styles.sheetTitle, { color: colors.text }]}>Add new service</AppText>
            <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />

            <SurfaceTextField
              containerStyle={styles.field}
              label="Service name"
              onChangeText={setName}
              value={name}
            />
            <SurfaceTextField
              containerStyle={styles.field}
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
              <AppText style={[styles.submitError, { color: '#fca5a5' }]}>{submitError}</AppText>
            ) : null}

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
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  sheetBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.76)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheetWrap: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '96%',
    minHeight: '92%',
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
  },
  sheetContent: {
    paddingBottom: 6,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  headerDivider: {
    height: 1,
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  descriptionInput: {
    minHeight: 110,
    paddingTop: 12,
  },
  descriptionToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  submitError: {
    fontSize: 13,
    fontWeight: '600',
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
