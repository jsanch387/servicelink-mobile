import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  InlineCardError,
  SurfaceTextField,
} from '../../../components/ui';
import { isValidEmailFormat } from '../../../utils/email';
import {
  canonicalNanpDigits,
  formatPhoneInputAsYouType,
  US_NANP_FORMATTED_MAX_LENGTH,
} from '../../../utils/phone';
import { useTheme } from '../../../theme';
import { useCreateCustomer } from '../hooks/useCreateCustomer';

/** Enough for notes without an on-screen counter; trims abuse. */
const NOTES_MAX_LEN = 800;

/** Success check — readable on light + dark `shellElevated` */
const SUCCESS_GREEN = '#22c55e';

/**
 * Bottom sheet to add a CRM customer (Supabase `customers` insert; `id` from DB default).
 */
export function AddCustomerSheet({ businessId, visible, onRequestClose }) {
  const { colors } = useTheme();
  const {
    mutateAsync: createCustomer,
    reset: resetCreateCustomer,
    isPending: isCreatingCustomer,
  } = useCreateCustomer(businessId);
  /** `'form'` → details; `'done'` → confirmation after successful insert. */
  const [phase, setPhase] = useState('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setPhase('form');
    setName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setSubmitError(null);
    resetCreateCustomer();
  }, [visible, resetCreateCustomer]);

  const phoneDigits = useMemo(() => canonicalNanpDigits(phone), [phone]);
  const phoneIncomplete = phoneDigits.length > 0 && phoneDigits.length < 10;
  const emailTrimmed = email.trim();
  const emailInvalid = emailTrimmed.length > 0 && !isValidEmailFormat(email);

  const canSave =
    Boolean(businessId) &&
    name.trim().length > 0 &&
    !phoneIncomplete &&
    !emailInvalid &&
    notes.length <= NOTES_MAX_LEN;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        helper: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 16,
        },
        fieldError: {
          color: colors.danger,
          fontSize: 13,
          fontWeight: '600',
          lineHeight: 18,
          marginBottom: 0,
          marginTop: 2,
        },
        fieldFlushBottom: {
          marginBottom: 0,
        },
        fieldGroup: {
          marginBottom: 20,
        },
        footer: {
          gap: 12,
          marginTop: 8,
          paddingTop: 8,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        rowGrow: {
          flex: 1,
        },
        notesInput: {
          minHeight: 100,
        },
        confirmWrap: {
          alignItems: 'center',
          paddingBottom: 8,
          paddingTop: 12,
        },
        confirmIconWrap: {
          marginBottom: 16,
        },
        confirmTitle: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '800',
          letterSpacing: -0.3,
          marginBottom: 8,
          textAlign: 'center',
        },
        confirmSub: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 22,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  function handleClose() {
    onRequestClose?.();
  }

  async function handleAdd() {
    if (!canSave) return;
    setSubmitError(null);
    try {
      await createCustomer({
        fullName: name.trim(),
        phone,
        email: email.trim(),
        notes: notes.trim(),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setPhase('done');
    } catch (e) {
      setSubmitError(e?.message ?? 'Could not add customer.');
    }
  }

  const sheetTitle = phase === 'form' ? 'Add customer' : null;

  const footer =
    phase === 'form' ? (
      <View style={styles.footer}>
        {submitError ? <InlineCardError message={submitError} /> : null}
        <View style={styles.row}>
          <View style={styles.rowGrow}>
            <Button fullWidth title="Cancel" variant="secondary" onPress={handleClose} />
          </View>
          <View style={styles.rowGrow}>
            <Button
              disabled={!canSave || isCreatingCustomer}
              fullWidth
              loading={isCreatingCustomer}
              title="Add"
              variant="surfaceLight"
              onPress={() => {
                void handleAdd();
              }}
            />
          </View>
        </View>
      </View>
    ) : (
      <View style={styles.footer}>
        <Button fullWidth title="Done" variant="primary" onPress={handleClose} />
      </View>
    );

  return (
    <BottomSheetModal
      footer={footer}
      sheetHeightPercent={phase === 'form' ? 92 : 44}
      title={sheetTitle}
      visible={visible}
      onRequestClose={handleClose}
    >
      {phase === 'form' ? (
        <>
          <AppText style={styles.helper}>Add a new customer to your list.</AppText>
          <SurfaceTextField label="Name *" onChangeText={setName} value={name} />
          <View style={styles.fieldGroup}>
            <SurfaceTextField
              containerStyle={styles.fieldFlushBottom}
              keyboardType="phone-pad"
              label="Phone number (optional)"
              maxLength={US_NANP_FORMATTED_MAX_LENGTH}
              onChangeText={(t) => setPhone(formatPhoneInputAsYouType(t))}
              value={phone}
            />
            {phoneIncomplete ? (
              <AppText style={styles.fieldError}>
                Enter a complete US number or leave this blank.
              </AppText>
            ) : null}
          </View>
          <View style={styles.fieldGroup}>
            <SurfaceTextField
              autoCapitalize="none"
              autoCorrect={false}
              containerStyle={styles.fieldFlushBottom}
              keyboardType="email-address"
              label="Email (optional)"
              onChangeText={setEmail}
              value={email}
            />
            {emailInvalid ? (
              <AppText style={styles.fieldError}>Enter a valid email address.</AppText>
            ) : null}
          </View>
          <SurfaceTextField
            label="Notes (optional)"
            maxLength={NOTES_MAX_LEN}
            multiline
            onChangeText={setNotes}
            style={styles.notesInput}
            textAlignVertical="top"
            value={notes}
          />
        </>
      ) : (
        <View style={styles.confirmWrap}>
          <View
            accessibilityLabel="Success, customer added"
            accessibilityRole="image"
            style={styles.confirmIconWrap}
          >
            <Ionicons color={SUCCESS_GREEN} name="checkmark-circle" size={64} />
          </View>
          <AppText style={styles.confirmTitle}>Customer added</AppText>
          <AppText style={styles.confirmSub}>
            {`${name.trim()} is on your list. Tap Done to continue.`}
          </AppText>
        </View>
      )}
    </BottomSheetModal>
  );
}
