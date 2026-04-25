import { useEffect, useState } from 'react';
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

/**
 * Bottom-sheet style modal for creating or editing a business add-on (same shell as pricing option editor).
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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

  function closeFromBackdrop() {
    if (!allowBackdropClose) return;
    onRequestClose?.();
  }

  async function handlePrimary() {
    if (!canSave || !onSave) return;
    await onSave({
      name: name.trim(),
      price,
      durationHHmm,
    });
  }

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onRequestClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
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
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <AppText style={[styles.sheetTitle, { color: colors.text }]}>{title}</AppText>

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
                title={primaryButtonTitle}
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
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
    alignSelf: 'center',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '78%',
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
  field: {
    marginBottom: 14,
  },
  durationField: {
    marginTop: 0,
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
