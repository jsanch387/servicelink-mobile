import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, SurfaceEmailField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { isValidEmailFormat } from '../../../../utils/email';
import {
  COMPLETE_VISIT_RECEIPT_EMAIL_DIALOG_SUBTITLE,
  COMPLETE_VISIT_RECEIPT_EMAIL_DIALOG_TITLE,
  COMPLETE_VISIT_RECEIPT_EMAIL_PLACEHOLDER,
  COMPLETE_VISIT_RECEIPT_EMAIL_SAVE_LABEL,
} from '../constants/completeVisitReceiptEmailCopy';

/**
 * In-sheet email overlay for Tap to Pay receipt capture (no nested Modal).
 *
 * @param {{
 *   visible: boolean;
 *   onClose: () => void;
 *   initialEmail?: string;
 *   onSave: (email: string) => void | Promise<void>;
 * }} props
 */
export function CompleteVisitReceiptEmailDialog({ visible, onClose, initialEmail = '', onSave }) {
  const { colors } = useTheme();
  const [email, setEmail] = useState(String(initialEmail ?? '').trim());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmail(String(initialEmail ?? '').trim());
      setIsSaving(false);
    }
  }, [initialEmail, visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          ...StyleSheet.absoluteFillObject,
          alignItems: 'center',
          backgroundColor: colors.shell,
          justifyContent: 'center',
          paddingHorizontal: 16,
          zIndex: 20,
        },
        card: {
          alignSelf: 'stretch',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          gap: 14,
          paddingHorizontal: 20,
          paddingVertical: 20,
        },
        header: {
          gap: 4,
        },
        title: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.25,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        fieldFlush: {
          marginBottom: 0,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 4,
        },
        actionGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  if (!visible) {
    return null;
  }

  const canSave = isValidEmailFormat(email) && !isSaving;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    setIsSaving(true);
    try {
      await onSave(email.trim());
      Keyboard.dismiss();
    } catch {
      // Parent toast; keep overlay open so the user can retry.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <Pressable
        accessibilityRole="none"
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFillObject}
        onPress={Keyboard.dismiss}
      />
      <View style={styles.card}>
        <View style={styles.header}>
          <AppText style={styles.title}>{COMPLETE_VISIT_RECEIPT_EMAIL_DIALOG_TITLE}</AppText>
          <AppText style={styles.subtitle}>{COMPLETE_VISIT_RECEIPT_EMAIL_DIALOG_SUBTITLE}</AppText>
        </View>
        <SurfaceEmailField
          autoCapitalize="none"
          autoFocus
          containerStyle={styles.fieldFlush}
          editable={!isSaving}
          keyboardType="email-address"
          label={null}
          placeholder={COMPLETE_VISIT_RECEIPT_EMAIL_PLACEHOLDER}
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.actions}>
          <View style={styles.actionGrow}>
            <Button
              disabled={isSaving}
              fullWidth
              title="Cancel"
              variant="secondary"
              onPress={() => {
                if (isSaving) {
                  return;
                }
                Keyboard.dismiss();
                onClose();
              }}
            />
          </View>
          <View style={styles.actionGrow}>
            <Button
              disabled={!canSave}
              fullWidth
              loading={isSaving}
              title={COMPLETE_VISIT_RECEIPT_EMAIL_SAVE_LABEL}
              variant="primary"
              onPress={() => {
                void handleSave();
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
