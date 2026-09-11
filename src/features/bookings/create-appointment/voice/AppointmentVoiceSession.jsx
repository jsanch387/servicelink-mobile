import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, BetaLabel } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';
import { AppointmentVoiceOrb } from './AppointmentVoiceOrb';
import { AppointmentVoiceReview } from './AppointmentVoiceReview';
import {
  VOICE_HOLD_MS,
  VOICE_LISTEN_MS,
  emptyVoiceReviewDraft,
  isVoiceDemoReady,
  nextVoiceTurnIndex,
  voiceTurnAt,
} from './appointmentVoiceDemo';

/**
 * Talk first with no live fields. When the script finishes, switch to review → edit → submit.
 */
export function AppointmentVoiceSession({ visible, onRequestClose, onSubmit }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [turnIndex, setTurnIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const [latched, setLatched] = useState(false);
  const [mode, setMode] = useState('talk');
  const [draft, setDraft] = useState(emptyVoiceReviewDraft);
  const listenTimer = useRef(null);
  const holdTimer = useRef(null);
  const heldRef = useRef(false);
  const latchedRef = useRef(false);

  const turn = voiceTurnAt(turnIndex);
  const ready = isVoiceDemoReady(turn);
  const showAsk = mode === 'talk' && Boolean(turn.user) && !ready;

  const clearListenTimer = useCallback(() => {
    if (listenTimer.current) {
      clearTimeout(listenTimer.current);
      listenTimer.current = null;
    }
  }, []);

  const clearHoldTimer = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearListenTimer();
    clearHoldTimer();
    heldRef.current = false;
    latchedRef.current = false;
    setTurnIndex(0);
    setListening(false);
    setLatched(false);
    setMode('talk');
    setDraft(emptyVoiceReviewDraft());
  }, [clearHoldTimer, clearListenTimer]);

  useEffect(() => {
    if (!visible) {
      resetSession();
    }
  }, [resetSession, visible]);

  useEffect(() => () => {
    clearListenTimer();
    clearHoldTimer();
  }, [clearHoldTimer, clearListenTimer]);

  useEffect(() => {
    if (ready && mode === 'talk') {
      latchedRef.current = false;
      setLatched(false);
      setListening(false);
      setDraft({ ...emptyVoiceReviewDraft(), ...turn.slots });
      setMode('review');
    }
  }, [mode, ready, turn.slots]);

  useEffect(() => {
    if (mode !== 'talk' || !latched || ready) {
      return undefined;
    }
    clearListenTimer();
    listenTimer.current = setTimeout(() => {
      setTurnIndex((current) => nextVoiceTurnIndex(current));
      listenTimer.current = null;
    }, VOICE_LISTEN_MS);
    return () => clearListenTimer();
  }, [clearListenTimer, latched, mode, ready, turnIndex]);

  const handlePressIn = useCallback(() => {
    if (mode !== 'talk') {
      return;
    }
    heldRef.current = false;
    setListening(true);
    clearHoldTimer();
    holdTimer.current = setTimeout(() => {
      heldRef.current = true;
      holdTimer.current = null;
    }, VOICE_HOLD_MS);
  }, [clearHoldTimer, mode]);

  const handlePressOut = useCallback(() => {
    clearHoldTimer();
    if (mode !== 'talk' || !heldRef.current) {
      return;
    }
    latchedRef.current = false;
    setLatched(false);
    setListening(false);
    setTurnIndex((current) => nextVoiceTurnIndex(current));
  }, [clearHoldTimer, mode]);

  const handleTalk = useCallback(() => {
    if (mode !== 'talk' || heldRef.current) {
      return;
    }
    if (latchedRef.current) {
      latchedRef.current = false;
      setLatched(false);
      setListening(false);
      clearListenTimer();
      return;
    }
    clearHoldTimer();
    heldRef.current = false;
    latchedRef.current = true;
    setLatched(true);
    setListening(true);
  }, [clearHoldTimer, clearListenTimer, mode]);

  const handleChangeField = useCallback((key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit?.(draft);
    onRequestClose?.();
  }, [draft, onRequestClose, onSubmit]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        header: {
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: insets.top + 16,
        },
        headerOverlay: {
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 2,
        },
        talkStage: {
          alignItems: 'center',
          flex: 1,
          gap: 28,
          justifyContent: 'center',
          paddingHorizontal: SCREEN_GUTTER,
        },
        headerTop: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        closeHit: {
          marginLeft: -12,
        },
        closeFace: {
          justifyContent: 'center',
          minHeight: 44,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        closeLabel: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '500',
        },
        scroll: {
          flex: 1,
        },
        body: {
          flexGrow: 1,
          gap: 28,
          justifyContent: mode === 'talk' ? 'center' : 'flex-start',
          paddingBottom: 24,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: mode === 'talk' ? 8 : 16,
        },
        ask: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '600',
          letterSpacing: -0.4,
          lineHeight: 28,
          textAlign: 'center',
        },
        orbBlock: {
          alignItems: 'center',
        },
        talkHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
          marginTop: 2,
          textAlign: 'center',
        },
      }),
    [colors, insets.top, mode],
  );

  return (
    <Modal
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
        <View style={[styles.header, mode === 'talk' && styles.headerOverlay]}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityLabel="Close voice booking"
              accessibilityRole="button"
              style={styles.closeHit}
              testID="appointment-voice-close"
              onPress={onRequestClose}
            >
              {({ pressed }) => (
                <View style={[styles.closeFace, pressed && { opacity: 0.55 }]}>
                  <AppText style={styles.closeLabel}>Close</AppText>
                </View>
              )}
            </Pressable>
            <BetaLabel />
          </View>
        </View>

        {mode === 'review' ? (
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            <AppointmentVoiceReview
              draft={draft}
              onChangeField={handleChangeField}
              onSubmit={handleSubmit}
            />
          </ScrollView>
        ) : (
          <View style={styles.talkStage}>
            {showAsk ? <AppText style={styles.ask}>{turn.ai}</AppText> : null}
            <View style={styles.orbBlock}>
              <AppointmentVoiceOrb
                accessibilityLabel="Tap to keep listening, or hold to talk"
                listening={listening}
                size={200}
                testID="appointment-voice-talk"
                onPress={handleTalk}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              />
              <AppText style={styles.talkHint}>
                {listening
                  ? latched
                    ? 'Listening… Tap to stop'
                    : 'Listening… Release to send'
                  : 'Tap to keep listening · Hold to talk'}
              </AppText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
