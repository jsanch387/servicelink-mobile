import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  EchoBarsLoader,
  SubmitOutcomeError,
  SuccessConfirmation,
  SurfaceEmailField,
} from '../../../components/ui';
import { useCyclingStatusMessage } from '../../../hooks/useCyclingStatusMessage';
import { useTheme } from '../../../theme';
import { fireErrorHaptic, fireSelectionHaptic, fireSuccessHaptic } from '../../../utils/feedbackHaptics';
import { isValidEmailFormat } from '../../../utils/email';
import {
  TEAM_INVITE_DONE_BUTTON,
  TEAM_INVITE_EMAIL_PLACEHOLDER,
  TEAM_INVITE_ERROR_TITLE,
  TEAM_INVITE_INVALID_EMAIL,
  TEAM_INVITE_PENDING_MESSAGES,
  TEAM_INVITE_PENDING_TITLE,
  TEAM_INVITE_SEND_BUTTON,
  TEAM_INVITE_SHEET_BODY,
  TEAM_INVITE_SHEET_TITLE,
  TEAM_INVITE_SUCCESS_BODY,
  TEAM_INVITE_SUCCESS_TITLE,
} from '../constants/teamMembersCopy';

const STAGE_HEIGHT = 188;
const FOOTER_HEIGHT = 52;
const PENDING_INTERVAL_MS = 2200;

const DESIGN_PHASES = [
  { id: 'idle', label: 'Confirm' },
  { id: 'pending', label: 'Sending' },
  { id: 'success', label: 'Sent' },
  { id: 'error', label: 'Error' },
];

/**
 * Add member sheet — email form, then in-sheet pending / success / error.
 */
export function InviteTeamMemberSheet({
  visible,
  designPreview = false,
  onRequestClose,
  onInvite,
}) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successReplayKey, setSuccessReplayKey] = useState(0);
  const busyRef = useRef(false);

  const pendingMessage = useCyclingStatusMessage(
    phase === 'pending',
    TEAM_INVITE_PENDING_MESSAGES,
    PENDING_INTERVAL_MS,
    { loop: true },
  );

  const resetState = useCallback(() => {
    busyRef.current = false;
    setEmail('');
    setFieldError(null);
    setPhase('idle');
    setErrorMessage('');
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  const canSend = isValidEmailFormat(email) && phase === 'idle';

  const enterSuccess = useCallback(() => {
    setPhase('success');
    setSuccessReplayKey((n) => n + 1);
    fireSuccessHaptic();
  }, []);

  const enterError = useCallback((message) => {
    setErrorMessage(String(message ?? '').trim() || TEAM_INVITE_INVALID_EMAIL);
    setPhase('error');
    fireErrorHaptic();
  }, []);

  const handleSend = useCallback(async () => {
    if (busyRef.current || phase === 'pending') return;
    if (!isValidEmailFormat(email)) {
      setFieldError(TEAM_INVITE_INVALID_EMAIL);
      return;
    }
    busyRef.current = true;
    setFieldError(null);
    setPhase('pending');
    try {
      const result = await onInvite?.(email);
      busyRef.current = false;
      if (result?.ok) {
        enterSuccess();
        return;
      }
      enterError(result?.error);
    } catch (err) {
      busyRef.current = false;
      enterError(err?.message);
    }
  }, [email, enterError, enterSuccess, onInvite, phase]);

  const handleTryAgain = useCallback(() => {
    setErrorMessage('');
    setPhase('idle');
  }, []);

  const requestClose = useCallback(() => {
    if (phase === 'pending') return;
    onRequestClose?.();
  }, [onRequestClose, phase]);

  const setDesignPhase = useCallback((next) => {
    busyRef.current = false;
    fireSelectionHaptic();
    setFieldError(null);
    setErrorMessage(next === 'error' ? TEAM_INVITE_INVALID_EMAIL : '');
    if (next === 'success') {
      setSuccessReplayKey((n) => n + 1);
      fireSuccessHaptic();
    } else if (next === 'error') {
      fireErrorHaptic();
    }
    setPhase(next);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stage: {
          alignItems: 'center',
          flexShrink: 0,
          height: STAGE_HEIGHT,
          justifyContent: 'flex-start',
          minHeight: STAGE_HEIGHT,
          paddingTop: 4,
          width: '100%',
        },
        form: {
          alignSelf: 'stretch',
          width: '100%',
        },
        emailField: {
          marginBottom: 0,
        },
        pendingWrap: {
          alignItems: 'center',
          flex: 1,
          gap: 16,
          justifyContent: 'center',
          width: '100%',
        },
        pendingMessage: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.2,
          minHeight: 22,
          textAlign: 'center',
        },
        outcome: {
          alignSelf: 'stretch',
          paddingTop: 8,
          width: '100%',
        },
        footer: {
          height: FOOTER_HEIGHT,
          justifyContent: 'center',
        },
        designRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          paddingBottom: 10,
        },
        designChip: {
          borderColor: colors.border,
          borderRadius: 999,
          borderWidth: StyleSheet.hairlineWidth,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        designChipActive: {
          backgroundColor: colors.buttonPrimaryBg,
          borderColor: colors.buttonPrimaryBg,
        },
        designChipText: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
        },
        designChipTextActive: {
          color: colors.buttonPrimaryText,
        },
      }),
    [colors],
  );

  let stageContent = null;
  if (phase === 'pending') {
    stageContent = (
      <View
        accessibilityLabel={pendingMessage || TEAM_INVITE_PENDING_TITLE}
        accessibilityLiveRegion="polite"
        style={styles.pendingWrap}
      >
        <EchoBarsLoader accessibilityLabel={TEAM_INVITE_PENDING_TITLE} size="large" />
        <AppText style={styles.pendingMessage}>{pendingMessage || TEAM_INVITE_PENDING_TITLE}</AppText>
      </View>
    );
  } else if (phase === 'success') {
    stageContent = (
      <View style={styles.outcome}>
        <SuccessConfirmation
          body={TEAM_INVITE_SUCCESS_BODY}
          iconAccessibilityLabel={TEAM_INVITE_SUCCESS_TITLE}
          replayKey={successReplayKey}
          title={TEAM_INVITE_SUCCESS_TITLE}
        />
      </View>
    );
  } else if (phase === 'error') {
    stageContent = (
      <View style={styles.outcome}>
        <SubmitOutcomeError
          iconAccessibilityLabel="Invite could not be sent"
          message={errorMessage}
          showPrimaryAction={false}
          title={TEAM_INVITE_ERROR_TITLE}
          variant="inline"
          onPrimaryAction={handleTryAgain}
        />
      </View>
    );
  } else {
    stageContent = (
      <View style={styles.form}>
        <SurfaceEmailField
          autoFocus
          compact
          containerStyle={styles.emailField}
          errorText={fieldError ?? undefined}
          label="Email"
          placeholder={TEAM_INVITE_EMAIL_PLACEHOLDER}
          returnKeyType="done"
          value={email}
          onChangeText={(next) => {
            setEmail(next);
            if (fieldError) setFieldError(null);
          }}
          onSubmitEditing={() => {
            void handleSend();
          }}
        />
      </View>
    );
  }

  const showSend = phase === 'idle';
  const showDone = phase === 'success';
  const showTryAgain = phase === 'error';

  return (
    <BottomSheetModal
      allowBackdropClose={phase !== 'pending'}
      fitContent
      showCloseButton
      showHeaderDivider
      subtitle={TEAM_INVITE_SHEET_BODY}
      footer={
        <View>
          {designPreview ? (
            <View style={styles.designRow}>
              {DESIGN_PHASES.map((item) => {
                const active = phase === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityLabel={`Preview ${item.label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={[styles.designChip, active && styles.designChipActive]}
                    onPress={() => setDesignPhase(item.id)}
                  >
                    <AppText style={[styles.designChipText, active && styles.designChipTextActive]}>
                      {item.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={styles.footer}>
            {showSend ? (
              <Button
                accessibilityLabel={TEAM_INVITE_SEND_BUTTON}
                disabled={!canSend}
                fullWidth
                title={TEAM_INVITE_SEND_BUTTON}
                variant="surfaceLight"
                onPress={() => {
                  void handleSend();
                }}
              />
            ) : null}
            {showDone ? (
              <Button
                accessibilityLabel={TEAM_INVITE_DONE_BUTTON}
                fullWidth
                title={TEAM_INVITE_DONE_BUTTON}
                variant="surfaceLight"
                onPress={requestClose}
              />
            ) : null}
            {showTryAgain ? (
              <Button
                accessibilityLabel="Try again"
                fullWidth
                title="Try again"
                variant="surfaceLight"
                onPress={handleTryAgain}
              />
            ) : null}
          </View>
        </View>
      }
      title={TEAM_INVITE_SHEET_TITLE}
      visible={visible}
      onRequestClose={requestClose}
    >
      <View style={styles.stage}>{stageContent}</View>
    </BottomSheetModal>
  );
}
