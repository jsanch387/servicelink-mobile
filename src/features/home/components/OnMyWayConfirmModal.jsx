import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  EchoBarsLoader,
  SuccessConfirmation,
} from '../../../components/ui';
import { SUBMIT_OUTCOME_ERROR } from '../../../components/ui/submitOutcomeTokens';
import { useCyclingStatusMessage } from '../../../hooks/useCyclingStatusMessage';
import { useTheme } from '../../../theme';
import {
  fireErrorHaptic,
  fireSelectionHaptic,
  fireSuccessHaptic,
} from '../../../utils/feedbackHaptics';

const STAGE_MIN_HEIGHT = 176;
const FOOTER_MIN_HEIGHT = 56;
const PENDING_INTERVAL_MS = 2200;
const SUCCESS_AUTO_CLOSE_MS = 1700;

const DEFAULT_PENDING_MESSAGES = [
  'Sending text',
  'Notifying customer',
  'Updating job status',
  'Almost done',
];

const DESIGN_PHASES = [
  { id: 'idle', label: 'Confirm' },
  { id: 'pending', label: 'Sending' },
  { id: 'success', label: 'Sent' },
  { id: 'error', label: 'Error' },
];

/**
 * Confirm before sending a customer status text (bottom sheet).
 * Used for On my way and work-finished (Done).
 *
 * Phases: idle → pending (EchoBars + rotating copy) → success / error.
 * Sheet height stays fixed; only the middle stage content swaps.
 *
 * Uses experimental `appearance="glass"` on BottomSheetModal.
 *
 * @param {{
 *   visible: boolean;
 *   designPreview?: boolean;
 *   idleBody?: string;
 *   successTitle?: string;
 *   successBody?: string;
 *   pendingMessages?: string[];
 *   skipAccessibilityHint?: string;
 *   sendAccessibilityHint?: string;
 *   onRequestClose: () => void;
 *   onConfirm: () => void | Promise<{ ok?: boolean; skipped?: boolean; error?: { message?: string } }>;
 *   onSkip: () => void;
 * }} props
 */
export function OnMyWayConfirmModal({
  visible,
  designPreview = false,
  idleBody = 'Let your customer know you are on the way.',
  successTitle = 'Text sent',
  successBody = 'Your customer knows you’re on the way.',
  pendingMessages = DEFAULT_PENDING_MESSAGES,
  skipAccessibilityHint = 'Continues without texting the customer',
  sendAccessibilityHint = 'Texts the customer',
  onRequestClose,
  onConfirm,
  onSkip,
}) {
  const { colors } = useTheme();
  const [phase, setPhase] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [successReplayKey, setSuccessReplayKey] = useState(0);
  const autoCloseTimerRef = useRef(null);
  const busyRef = useRef(false);

  const pendingMessage = useCyclingStatusMessage(
    phase === 'pending',
    pendingMessages,
    PENDING_INTERVAL_MS,
    { loop: true },
  );

  const clearAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    clearAutoClose();
    busyRef.current = false;
    setPhase('idle');
    setErrorMessage('');
  }, [clearAutoClose]);

  useEffect(() => {
    if (!visible) {
      resetState();
    }
  }, [visible, resetState]);

  useEffect(() => () => clearAutoClose(), [clearAutoClose]);

  const scheduleSuccessClose = useCallback(() => {
    clearAutoClose();
    autoCloseTimerRef.current = setTimeout(() => {
      onRequestClose();
    }, SUCCESS_AUTO_CLOSE_MS);
  }, [clearAutoClose, onRequestClose]);

  const enterSuccess = useCallback(() => {
    setPhase('success');
    setSuccessReplayKey((n) => n + 1);
    fireSuccessHaptic();
    scheduleSuccessClose();
  }, [scheduleSuccessClose]);

  const enterError = useCallback((message) => {
    setErrorMessage(message?.trim() || 'Couldn’t send the text. Try again.');
    setPhase('error');
    fireErrorHaptic();
  }, []);

  const runConfirm = useCallback(async () => {
    if (busyRef.current || phase === 'pending') {
      return;
    }
    busyRef.current = true;
    setPhase('pending');
    setErrorMessage('');

    try {
      const result = await Promise.resolve(onConfirm());
      busyRef.current = false;

      if (result?.skipped) {
        onRequestClose();
        return;
      }
      if (result == null || result.ok) {
        enterSuccess();
        return;
      }
      enterError(result.error?.message);
    } catch (err) {
      busyRef.current = false;
      enterError(err?.message);
    }
  }, [enterError, enterSuccess, onConfirm, onRequestClose, phase]);

  const handleSkip = useCallback(() => {
    if (phase !== 'idle') {
      return;
    }
    onSkip();
  }, [onSkip, phase]);

  const handleTryAgain = useCallback(() => {
    setErrorMessage('');
    void runConfirm();
  }, [runConfirm]);

  const requestClose = useCallback(() => {
    if (phase === 'pending') {
      return;
    }
    clearAutoClose();
    onRequestClose();
  }, [clearAutoClose, onRequestClose, phase]);

  const setDesignPhase = useCallback(
    (next) => {
      clearAutoClose();
      busyRef.current = false;
      fireSelectionHaptic();
      setErrorMessage(next === 'error' ? 'Couldn’t send the text. Try again.' : '');
      if (next === 'success') {
        setSuccessReplayKey((n) => n + 1);
        fireSuccessHaptic();
      } else if (next === 'error') {
        fireErrorHaptic();
      }
      setPhase(next);
    },
    [clearAutoClose],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stage: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: STAGE_MIN_HEIGHT,
          paddingBottom: 12,
          paddingHorizontal: 8,
          paddingTop: 8,
          width: '100%',
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: colors.buttonPrimaryBg,
          borderRadius: 16,
          elevation: 4,
          height: 60,
          justifyContent: 'center',
          marginBottom: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.28,
          shadowRadius: 10,
          width: 60,
        },
        body: {
          alignSelf: 'stretch',
          color: colors.text,
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 23,
          textAlign: 'center',
        },
        pendingWrap: {
          alignItems: 'center',
          gap: 18,
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
        outcomeWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        },
        outcomeCopy: {
          alignItems: 'center',
          gap: 4,
          maxWidth: 280,
        },
        outcomeTitle: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.35,
          textAlign: 'center',
        },
        outcomeBody: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 20,
          textAlign: 'center',
        },
        errorIcon: {
          alignItems: 'center',
          backgroundColor: SUBMIT_OUTCOME_ERROR.ring,
          borderRadius: 999,
          height: 72,
          justifyContent: 'center',
          marginBottom: 16,
          width: 72,
        },
        footer: {
          gap: 12,
          minHeight: FOOTER_MIN_HEIGHT + 8,
          paddingTop: 8,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
          minHeight: FOOTER_MIN_HEIGHT,
        },
        rowGrow: {
          flex: 1,
        },
        designRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
          paddingBottom: 4,
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
        accessibilityLiveRegion="polite"
        accessibilityLabel={pendingMessage}
        style={styles.pendingWrap}
      >
        <EchoBarsLoader accessibilityLabel="Sending on my way text" size="large" />
        <AppText style={styles.pendingMessage}>{pendingMessage}</AppText>
      </View>
    );
  } else if (phase === 'success') {
    stageContent = (
      <SuccessConfirmation
        body={successBody}
        iconAccessibilityLabel="Text sent"
        replayKey={successReplayKey}
        title={successTitle}
      />
    );
  } else if (phase === 'error') {
    stageContent = (
      <ErrorStage
        body={errorMessage}
        styles={styles}
        title="Text not sent"
        visible={phase === 'error'}
      />
    );
  } else {
    stageContent = (
      <>
        <View style={styles.iconBadge}>
          <Ionicons
            accessibilityElementsHidden
            color={colors.buttonPrimaryText}
            importantForAccessibility="no"
            name="chatbubble-ellipses-outline"
            size={28}
          />
        </View>
        <AppText style={styles.body}>{idleBody}</AppText>
      </>
    );
  }

  const showIdleActions = phase === 'idle';
  const showErrorActions = phase === 'error';
  const showFooterSpacer = phase === 'pending' || phase === 'success';

  return (
    <BottomSheetModal
      allowBackdropClose={phase !== 'pending'}
      appearance="glass"
      fitContent
      footer={
        <View style={styles.footer}>
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
          {showIdleActions ? (
            <View style={styles.row}>
              <View style={styles.rowGrow}>
                <Button
                  accessibilityHint={skipAccessibilityHint}
                  accessibilityLabel="Skip"
                  fullWidth
                  title="Skip"
                  variant="secondary"
                  onPress={handleSkip}
                />
              </View>
              <View style={styles.rowGrow}>
                <Button
                  accessibilityHint={sendAccessibilityHint}
                  accessibilityLabel="Send"
                  fullWidth
                  iconName="paper-plane-outline"
                  title="Send"
                  variant="primary"
                  onPress={() => {
                    void runConfirm();
                  }}
                />
              </View>
            </View>
          ) : null}
          {showErrorActions ? (
            <View style={styles.row}>
              <View style={styles.rowGrow}>
                <Button
                  accessibilityLabel="Close"
                  fullWidth
                  title="Close"
                  variant="secondary"
                  onPress={requestClose}
                />
              </View>
              <View style={styles.rowGrow}>
                <Button
                  accessibilityLabel="Try again"
                  fullWidth
                  title="Try again"
                  variant="primary"
                  onPress={handleTryAgain}
                />
              </View>
            </View>
          ) : null}
          {showFooterSpacer ? <View style={styles.row} /> : null}
        </View>
      }
      showCloseButton={phase !== 'pending'}
      showHeaderDivider
      title="Send text?"
      visible={visible}
      onRequestClose={requestClose}
    >
      <View style={styles.stage}>{stageContent}</View>
    </BottomSheetModal>
  );
}

/**
 * Error stage with a short rise-in to match success polish.
 */
function ErrorStage({ body, styles, title, visible }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }
    opacity.setValue(0);
    translateY.setValue(14);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  return (
    <Animated.View style={[styles.outcomeWrap, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.errorIcon}>
        <Ionicons color={SUBMIT_OUTCOME_ERROR.color} name="alert-circle" size={36} />
      </View>
      <View style={styles.outcomeCopy}>
        <AppText style={styles.outcomeTitle}>{title}</AppText>
        <AppText style={styles.outcomeBody}>{body}</AppText>
      </View>
    </Animated.View>
  );
}
