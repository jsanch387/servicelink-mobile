import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Vibration, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  EchoBarsLoader,
  SuccessConfirmation,
} from '../../../../components/ui';
import { useCyclingStatusMessage } from '../../../../hooks/useCyclingStatusMessage';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import {
  fireErrorHaptic,
  fireSelectionHaptic,
  fireSuccessHaptic,
} from '../../../../utils/feedbackHaptics';
import {
  JOB_STATUS,
  normalizeJobStatus,
  normalizeWorkHandoffStatus,
  WORK_HANDOFF_STATUS,
} from '../../constants/jobStatus';
import { useBookingAction } from '../../hooks/useBookingAction';
import { resolveJobStatusSheetActions } from '../utils/resolveJobStatusSheetActions';

/** @typedef {'on_the_way' | 'start_job' | 'work_finished'} JobStatusActionId */
/** @typedef {'active' | 'done' | 'upcoming'} JobStatusRowState */
/** @typedef {'list' | 'idle' | 'pending' | 'success' | 'error'} SheetPhase */

const PENDING_INTERVAL_MS = 2200;
const SUCCESS_HOLD_MS = 1400;
/** Keeps sheet height stable when swapping list ↔ confirm (one modal, content only). */
const STAGE_MIN_HEIGHT = 236;
const FALLBACK_ERROR = "Couldn't send the text. Try again.";

const ACTION_COPY = {
  on_the_way: {
    idleBody: 'Let your customer know you are on the way.',
    successTitle: 'Text sent',
    successBody: 'Your customer knows you’re on the way.',
    pendingMessages: ['Sending text', 'Notifying customer', 'Updating job status', 'Almost done'],
    showSkip: true,
    activeHint: 'Send on the way text',
    doneHint: 'Already sent',
    upcomingHint: 'Available after you mark on the way',
  },
  start_job: {
    idleBody: 'Let your customer know work has started.',
    successTitle: 'Job started',
    successBody: 'Your customer knows you’ve started.',
    pendingMessages: ['Sending text', 'Notifying customer', 'Updating job status', 'Almost done'],
    showSkip: false,
    activeHint: 'Send job started text',
    doneHint: 'Already started',
    upcomingHint: 'Available after you mark on the way',
  },
  work_finished: {
    idleBody: 'Let your customer know you are done.',
    successTitle: 'Text sent',
    successBody: 'Your customer knows you’re finished.',
    pendingMessages: ['Sending text', 'Notifying customer', 'Updating job status', 'Almost done'],
    showSkip: true,
    activeHint: 'Send work finished text',
    doneHint: 'Already finished',
    upcomingHint: 'Available after the job is started',
  },
};

/**
 * @param {boolean} isDark
 */
function buildActions(isDark) {
  return [
    {
      id: /** @type {JobStatusActionId} */ ('on_the_way'),
      icon: /** @type {const} */ ('car-outline'),
      title: 'On my way',
      accessibilityHint: 'Texts the customer that you are headed over',
      iconColor: isDark ? '#93c5fd' : '#2563eb',
      iconBg: isDark ? 'rgba(147, 197, 253, 0.18)' : 'rgba(37, 99, 235, 0.12)',
    },
    {
      id: /** @type {JobStatusActionId} */ ('start_job'),
      icon: /** @type {const} */ ('play-outline'),
      title: 'Start job',
      accessibilityHint: 'Texts the customer that work has started',
      iconColor: isDark ? '#c4b5fd' : '#7c3aed',
      iconBg: isDark ? 'rgba(167, 139, 250, 0.18)' : 'rgba(124, 58, 237, 0.12)',
    },
    {
      id: /** @type {JobStatusActionId} */ ('work_finished'),
      icon: /** @type {const} */ ('checkmark-outline'),
      title: 'Work finished',
      accessibilityHint:
        'Texts the customer that work is finished. Still use Complete for payment and closeout.',
      iconColor: isDark ? '#86efac' : '#16a34a',
      iconBg: isDark ? 'rgba(74, 222, 128, 0.18)' : 'rgba(22, 163, 74, 0.12)',
    },
  ];
}

/**
 * @param {string | null | undefined} workHandoffStatus
 * @returns {Set<JobStatusActionId>}
 */
function skippedFromHandoff(workHandoffStatus) {
  /** @type {Set<JobStatusActionId>} */
  const next = new Set();
  if (normalizeWorkHandoffStatus(workHandoffStatus) === WORK_HANDOFF_STATUS.SKIPPED) {
    next.add('work_finished');
  }
  return next;
}

/**
 * @param {{
 *   action: ReturnType<typeof buildActions>[number];
 *   rowState: JobStatusRowState;
 *   wasSkipped?: boolean;
 *   onPress: () => void;
 * }} props
 */
function JobStatusActionRow({ action, rowState, wasSkipped = false, onPress }) {
  const { colors, isDark } = useTheme();
  const isActive = rowState === 'active';
  const isDone = rowState === 'done';
  const isUpcoming = rowState === 'upcoming';
  const copy = ACTION_COPY[action.id];
  const doneHint = wasSkipped ? 'Skipped' : copy.doneHint;
  const doneIcon = wasSkipped ? /** @type {const} */ ('remove-circle-outline') : 'checkmark-circle';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          borderRadius: 14,
          overflow: 'hidden',
          width: '100%',
        },
        pressable: {
          alignSelf: 'stretch',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          backgroundColor: isDark ? '#0f0f0f' : colors.cardSurface,
          borderRadius: 14,
          flexDirection: 'row',
          minHeight: 64,
          opacity: isUpcoming ? 0.45 : 1,
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        rowPressed: {
          backgroundColor: isDark ? '#141414' : colors.buttonGhostPressed,
        },
        iconBadge: {
          alignItems: 'center',
          borderRadius: 12,
          flexShrink: 0,
          height: 40,
          justifyContent: 'center',
          marginRight: 14,
          opacity: isDone || isUpcoming ? 0.7 : 1,
          width: 40,
        },
        copy: {
          flex: 1,
          gap: 2,
          minWidth: 0,
        },
        title: {
          color: isDone || isUpcoming ? colors.textMuted : colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        meta: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
        },
        trailing: {
          flexShrink: 0,
          marginLeft: 8,
        },
      }),
    [colors, isDark, isDone, isUpcoming],
  );

  const fireHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  const accessibilityHint = isActive
    ? action.accessibilityHint
    : isDone
      ? doneHint
      : copy.upcomingHint;

  if (!isActive) {
    return (
      <View
        accessibilityHint={accessibilityHint}
        accessibilityLabel={action.title}
        accessibilityRole="text"
        accessibilityState={{ disabled: true }}
        style={styles.root}
      >
        <View style={styles.row}>
          <View style={[styles.iconBadge, { backgroundColor: action.iconBg }]}>
            <Ionicons color={action.iconColor} name={action.icon} size={22} />
          </View>
          <View style={styles.copy}>
            <AppText numberOfLines={1} style={styles.title}>
              {action.title}
            </AppText>
            <AppText numberOfLines={1} style={styles.meta}>
              {isDone ? doneHint : copy.upcomingHint}
            </AppText>
          </View>
          <Ionicons
            color={colors.textMuted}
            name={isDone ? doneIcon : 'lock-closed-outline'}
            size={18}
            style={styles.trailing}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={action.title}
        accessibilityRole="button"
        style={styles.pressable}
        onPress={() => {
          fireHaptic();
          onPress();
        }}
      >
        {({ pressed }) => (
          <View style={[styles.row, pressed && styles.rowPressed]}>
            <View style={[styles.iconBadge, { backgroundColor: action.iconBg }]}>
              <Ionicons color={action.iconColor} name={action.icon} size={22} />
            </View>
            <View style={styles.copy}>
              <AppText numberOfLines={1} style={styles.title}>
                {action.title}
              </AppText>
              <AppText numberOfLines={1} style={styles.meta}>
                {copy.activeHint}
              </AppText>
            </View>
            <Ionicons
              color={colors.textMuted}
              name="chevron-forward"
              size={18}
              style={styles.trailing}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Job-status actions gated by server `job_status` / `work_handoff_status`.
 * Same sheet swaps list → confirm → pending → success/error (no nested modal).
 * Uses {@link useBookingAction} so Next Up and booking details stay in sync.
 *
 * @param {{
 *   visible: boolean;
 *   bookingId?: string | null;
 *   businessId?: string | null;
 *   jobStatus?: string | null;
 *   workHandoffStatus?: string | null;
 *   onRequestClose: () => void;
 * }} props
 */
export function BookingJobStatusSheet({
  visible,
  bookingId = null,
  businessId = null,
  jobStatus = JOB_STATUS.NOT_STARTED,
  workHandoffStatus = null,
  onRequestClose,
}) {
  const { colors, isDark } = useTheme();
  const bookingAction = useBookingAction(businessId);
  const actions = useMemo(() => buildActions(isDark), [isDark]);

  const [skippedActions, setSkippedActions] = useState(() => skippedFromHandoff(workHandoffStatus));
  const [optimistic, setOptimistic] = useState(
    /** @type {{ jobStatus: string; workHandoffStatus: string | null } | null} */ (null),
  );
  const [confirmActionId, setConfirmActionId] = useState(
    /** @type {JobStatusActionId | null} */ (null),
  );
  const [phase, setPhase] = useState(/** @type {SheetPhase} */ ('list'));
  const [errorMessage, setErrorMessage] = useState('');
  const [successReplayKey, setSuccessReplayKey] = useState(0);
  const busyRef = useRef(false);
  const successTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));

  const confirmCopy = confirmActionId ? ACTION_COPY[confirmActionId] : null;
  const pendingMessages = confirmCopy?.pendingMessages ?? ACTION_COPY.on_the_way.pendingMessages;
  const pendingMessage = useCyclingStatusMessage(
    phase === 'pending',
    pendingMessages,
    PENDING_INTERVAL_MS,
    { loop: true },
  );

  const clearSuccessTimer = useCallback(() => {
    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, []);

  const resetToList = useCallback(() => {
    clearSuccessTimer();
    busyRef.current = false;
    setConfirmActionId(null);
    setErrorMessage('');
    setPhase('list');
  }, [clearSuccessTimer]);

  useEffect(() => {
    if (!visible) {
      resetToList();
      setOptimistic(null);
    }
  }, [visible, resetToList]);

  useEffect(() => {
    setSkippedActions((prev) => {
      const next = new Set(prev);
      const handoff = normalizeWorkHandoffStatus(workHandoffStatus);
      if (handoff === WORK_HANDOFF_STATUS.SKIPPED) {
        next.add('work_finished');
      } else if (handoff === WORK_HANDOFF_STATUS.NOTIFIED) {
        next.delete('work_finished');
      }
      return next;
    });
  }, [workHandoffStatus]);

  useEffect(() => {
    if (!optimistic) {
      return;
    }
    const propStatus = normalizeJobStatus(jobStatus);
    const optStatus = normalizeJobStatus(optimistic.jobStatus);
    if (propStatus !== optStatus) {
      return;
    }
    const propHandoff = normalizeWorkHandoffStatus(workHandoffStatus);
    const optHandoff = normalizeWorkHandoffStatus(optimistic.workHandoffStatus);
    if (optHandoff == null || propHandoff === optHandoff) {
      setOptimistic(null);
    }
  }, [jobStatus, optimistic, workHandoffStatus]);

  useEffect(() => () => clearSuccessTimer(), [clearSuccessTimer]);

  const displayJobStatus = optimistic?.jobStatus ?? jobStatus ?? JOB_STATUS.NOT_STARTED;
  const displayHandoffStatus =
    optimistic?.workHandoffStatus !== undefined
      ? optimistic.workHandoffStatus
      : (workHandoffStatus ?? null);

  const rowStates = useMemo(
    () => resolveJobStatusSheetActions(displayJobStatus, displayHandoffStatus),
    [displayHandoffStatus, displayJobStatus],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          gap: 10,
          paddingBottom: 6,
          paddingTop: 8,
          width: '100%',
        },
        stage: {
          justifyContent: 'center',
          minHeight: STAGE_MIN_HEIGHT,
          width: '100%',
        },
        confirmStage: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 8,
          paddingTop: 12,
          width: '100%',
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: colors.accent,
          borderRadius: 28,
          height: 56,
          justifyContent: 'center',
          marginBottom: 16,
          width: 56,
        },
        idleBody: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 22,
          textAlign: 'center',
        },
        pendingLabel: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          marginTop: 16,
          textAlign: 'center',
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 17,
          marginTop: 6,
          textAlign: 'center',
        },
        footer: {
          gap: 10,
          width: '100%',
        },
        footerRow: {
          flexDirection: 'row',
          gap: 10,
          width: '100%',
        },
        footerGrow: {
          flex: 1,
        },
      }),
    [colors],
  );

  const markSkipped = useCallback((actionId, skipped) => {
    setSkippedActions((prev) => {
      const next = new Set(prev);
      if (skipped) {
        next.add(actionId);
      } else {
        next.delete(actionId);
      }
      return next;
    });
  }, []);

  const applyServerResult = useCallback(
    (actionId, notify, result) => {
      markSkipped(actionId, !notify);
      const nextStatus =
        typeof result?.jobStatus === 'string' && result.jobStatus.trim()
          ? normalizeJobStatus(result.jobStatus)
          : null;
      const nextHandoff =
        result?.workHandoffStatus !== undefined
          ? normalizeWorkHandoffStatus(result.workHandoffStatus)
          : undefined;

      if (nextStatus) {
        setOptimistic({
          jobStatus: nextStatus,
          workHandoffStatus:
            nextHandoff !== undefined
              ? nextHandoff
              : actionId === 'work_finished'
                ? notify
                  ? WORK_HANDOFF_STATUS.NOTIFIED
                  : WORK_HANDOFF_STATUS.SKIPPED
                : null,
        });
        return;
      }

      if (actionId === 'on_the_way') {
        setOptimistic({ jobStatus: JOB_STATUS.ON_THE_WAY, workHandoffStatus: null });
      } else if (actionId === 'start_job') {
        setOptimistic({ jobStatus: JOB_STATUS.IN_PROGRESS, workHandoffStatus: null });
      } else if (actionId === 'work_finished') {
        setOptimistic({
          jobStatus: JOB_STATUS.IN_PROGRESS,
          workHandoffStatus: notify ? WORK_HANDOFF_STATUS.NOTIFIED : WORK_HANDOFF_STATUS.SKIPPED,
        });
      }
    },
    [markSkipped],
  );

  const enterSuccess = useCallback(() => {
    setPhase('success');
    setSuccessReplayKey((n) => n + 1);
    fireSuccessHaptic();
    clearSuccessTimer();
    successTimerRef.current = setTimeout(() => {
      busyRef.current = false;
      resetToList();
    }, SUCCESS_HOLD_MS);
  }, [clearSuccessTimer, resetToList]);

  const enterError = useCallback((message) => {
    busyRef.current = false;
    setErrorMessage(message?.trim() || FALLBACK_ERROR);
    setPhase('error');
    fireErrorHaptic();
  }, []);

  const runServerAction = useCallback(
    async (actionId, notify) => {
      if (!bookingId) {
        return { ok: false, error: { message: FALLBACK_ERROR } };
      }
      const options = { suppressUiFeedback: true };
      if (actionId === 'on_the_way') {
        return bookingAction.notifyOnTheWay(bookingId, notify, options);
      }
      if (actionId === 'start_job') {
        return bookingAction.startJobAsync(bookingId, options);
      }
      if (actionId === 'work_finished') {
        return bookingAction.workFinished(bookingId, notify, options);
      }
      return { ok: false, error: { message: FALLBACK_ERROR } };
    },
    [bookingAction, bookingId],
  );

  const runConfirm = useCallback(async () => {
    if (!confirmActionId || busyRef.current || (phase !== 'idle' && phase !== 'error')) {
      return;
    }
    if (bookingAction.disabled) {
      return;
    }
    busyRef.current = true;
    fireSelectionHaptic();
    setPhase('pending');
    setErrorMessage('');

    try {
      const result = await runServerAction(confirmActionId, true);
      if (result?.skipped) {
        busyRef.current = false;
        resetToList();
        return;
      }
      if (result?.ok) {
        applyServerResult(confirmActionId, true, result);
        enterSuccess();
        return;
      }
      enterError(result?.error?.message);
    } catch (err) {
      enterError(err?.message);
    }
  }, [
    applyServerResult,
    bookingAction.disabled,
    confirmActionId,
    enterError,
    enterSuccess,
    phase,
    resetToList,
    runServerAction,
  ]);

  const handleSkip = useCallback(async () => {
    if (!confirmActionId || busyRef.current) {
      return;
    }
    if (phase !== 'idle' && phase !== 'error') {
      return;
    }
    if (!ACTION_COPY[confirmActionId]?.showSkip) {
      return;
    }
    if (bookingAction.disabled) {
      return;
    }

    busyRef.current = true;
    fireSelectionHaptic();
    setPhase('pending');
    setErrorMessage('');

    try {
      const result = await runServerAction(confirmActionId, false);
      if (result?.skipped) {
        busyRef.current = false;
        resetToList();
        return;
      }
      if (result?.ok) {
        applyServerResult(confirmActionId, false, result);
        busyRef.current = false;
        resetToList();
        return;
      }
      enterError(result?.error?.message);
    } catch (err) {
      enterError(err?.message);
    }
  }, [
    applyServerResult,
    bookingAction.disabled,
    confirmActionId,
    enterError,
    phase,
    resetToList,
    runServerAction,
  ]);

  const handleSelectAction = useCallback(
    (actionId) => {
      if (rowStates[actionId] !== 'active' || bookingAction.disabled) {
        return;
      }
      setConfirmActionId(actionId);
      setErrorMessage('');
      setPhase('idle');
    },
    [bookingAction.disabled, rowStates],
  );

  const handleSheetClose = useCallback(() => {
    if (phase === 'pending') {
      return;
    }
    resetToList();
    onRequestClose();
  }, [onRequestClose, phase, resetToList]);

  const handleConfirmBack = useCallback(() => {
    if (phase === 'pending') {
      return;
    }
    resetToList();
  }, [phase, resetToList]);

  const footnote = rowStates.allDone ? 'Complete the appointment to close out.' : null;
  const inConfirm = phase !== 'list';
  const actionsBusy = bookingAction.disabled || phase === 'pending';

  const footer =
    phase === 'idle' && confirmCopy ? (
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {confirmCopy.showSkip ? (
            <View style={styles.footerGrow}>
              <Button
                accessibilityHint="Continues without texting the customer"
                accessibilityLabel="Skip"
                disabled={actionsBusy}
                fullWidth
                title="Skip"
                variant="secondary"
                onPress={() => {
                  void handleSkip();
                }}
              />
            </View>
          ) : null}
          <View style={styles.footerGrow}>
            <Button
              accessibilityHint="Texts the customer"
              accessibilityLabel="Send"
              disabled={actionsBusy}
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
      </View>
    ) : phase === 'error' ? (
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {confirmCopy?.showSkip ? (
            <View style={styles.footerGrow}>
              <Button
                accessibilityHint="Continues without texting the customer"
                accessibilityLabel="Skip"
                disabled={actionsBusy}
                fullWidth
                title="Skip"
                variant="secondary"
                onPress={() => {
                  void handleSkip();
                }}
              />
            </View>
          ) : (
            <View style={styles.footerGrow}>
              <Button
                accessibilityLabel="Back"
                fullWidth
                title="Back"
                variant="secondary"
                onPress={handleConfirmBack}
              />
            </View>
          )}
          <View style={styles.footerGrow}>
            <Button
              accessibilityLabel="Try again"
              disabled={actionsBusy}
              fullWidth
              title="Try again"
              variant="primary"
              onPress={() => {
                void runConfirm();
              }}
            />
          </View>
        </View>
      </View>
    ) : null;

  let stageContent = null;
  if (phase === 'list') {
    stageContent = (
      <View style={styles.body}>
        {actions.map((action) => (
          <JobStatusActionRow
            key={action.id}
            action={action}
            rowState={rowStates[action.id]}
            wasSkipped={skippedActions.has(action.id)}
            onPress={() => handleSelectAction(action.id)}
          />
        ))}
        {footnote ? <AppText style={styles.footnote}>{footnote}</AppText> : null}
      </View>
    );
  } else if (phase === 'idle' && confirmCopy) {
    stageContent = (
      <View style={styles.confirmStage}>
        <View style={styles.iconBadge}>
          <Ionicons color={colors.buttonPrimaryText} name="chatbubble-ellipses-outline" size={28} />
        </View>
        <AppText style={styles.idleBody}>{confirmCopy.idleBody}</AppText>
      </View>
    );
  } else if (phase === 'pending') {
    stageContent = (
      <View style={styles.confirmStage}>
        <EchoBarsLoader size="large" />
        <AppText style={styles.pendingLabel}>{pendingMessage}</AppText>
      </View>
    );
  } else if (phase === 'success' && confirmCopy) {
    stageContent = (
      <View style={styles.confirmStage}>
        <SuccessConfirmation
          body={confirmCopy.successBody}
          replayKey={successReplayKey}
          title={confirmCopy.successTitle}
        />
      </View>
    );
  } else if (phase === 'error') {
    stageContent = (
      <View style={styles.confirmStage}>
        <AppText style={styles.idleBody}>{errorMessage || FALLBACK_ERROR}</AppText>
      </View>
    );
  }

  return (
    <BottomSheetModal
      allowBackdropClose={phase !== 'pending'}
      fitContent
      footer={footer}
      showCloseButton={phase !== 'pending'}
      showHeaderDivider
      title="Job status"
      visible={visible}
      onRequestClose={inConfirm ? handleConfirmBack : handleSheetClose}
    >
      <View style={styles.stage}>{stageContent}</View>
    </BottomSheetModal>
  );
}
