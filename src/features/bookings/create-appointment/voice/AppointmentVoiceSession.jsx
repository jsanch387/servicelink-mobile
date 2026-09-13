import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, BetaLabel } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';
import { AppointmentVoiceOrb } from './AppointmentVoiceOrb';
import { AppointmentVoiceReview } from './AppointmentVoiceReview';
import { postVoiceTurn } from './api/postVoiceTurn';
import { VOICE_HOLD_MS, emptyVoiceReviewDraft } from './appointmentVoiceDemo';
import { playVoiceReply, stopVoiceReply } from './playVoiceReply';
import { useAppointmentVoiceRecorder } from './useAppointmentVoiceRecorder';

/**
 * Talk with the mic. Hold/latch records a clip, then POSTs `/api/voice/turn`.
 * Review opens only when the server returns `ready` — this stub does not.
 */
export function AppointmentVoiceSession({
  visible,
  accessToken,
  onRequestClose,
  onSubmit,
  onClip,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [listening, setListening] = useState(false);
  const [latched, setLatched] = useState(false);
  const [mode, setMode] = useState('talk');
  const [draft, setDraft] = useState(emptyVoiceReviewDraft);
  const [sending, setSending] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ask, setAsk] = useState('');
  const [turnError, setTurnError] = useState(null);
  const holdTimer = useRef(null);
  const heldRef = useRef(false);
  const latchedRef = useRef(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const handleClip = useCallback(
    (clip) => {
      latchedRef.current = false;
      heldRef.current = false;
      setLatched(false);
      setListening(false);
      onClip?.(clip);
      if (!clip?.uri) {
        return;
      }
      setSending(true);
      setTurnError(null);
      void postVoiceTurn(accessToken, { uri: clip.uri, draft: draftRef.current }).then((result) => {
        setSending(false);
        if (!result.ok) {
          setTurnError(result.error.message);
          return;
        }
        setTranscript(result.data.transcript);
        setAsk(result.data.ask);
        setDraft(result.data.draft);
        if (result.data.ready) {
          setMode('review');
        }
        void playVoiceReply({
          speak: result.data.speak,
          speakAudio: result.data.speakAudio,
        });
      });
    },
    [accessToken, onClip],
  );

  const { caption, finishClip, startListen } = useAppointmentVoiceRecorder({
    active: visible && mode === 'talk',
    latched,
    onClip: handleClip,
  });

  const clearHoldTimer = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    clearHoldTimer();
    heldRef.current = false;
    latchedRef.current = false;
    setListening(false);
    setLatched(false);
    setSending(false);
    setTranscript('');
    setAsk('');
    setTurnError(null);
    setMode('talk');
    setDraft(emptyVoiceReviewDraft());
    stopVoiceReply();
  }, [clearHoldTimer]);

  useEffect(() => {
    if (!visible) {
      resetSession();
    }
  }, [resetSession, visible]);

  useEffect(
    () => () => {
      clearHoldTimer();
    },
    [clearHoldTimer],
  );

  const handlePressIn = useCallback(() => {
    if (mode !== 'talk' || sending) {
      return;
    }
    heldRef.current = false;
    setListening(true);
    clearHoldTimer();
    holdTimer.current = setTimeout(() => {
      heldRef.current = true;
      holdTimer.current = null;
    }, VOICE_HOLD_MS);
    void startListen().then((started) => {
      if (!started && !latchedRef.current) {
        setListening(false);
      }
    });
  }, [clearHoldTimer, mode, sending, startListen]);

  const handlePressOut = useCallback(() => {
    clearHoldTimer();
    if (mode !== 'talk' || !heldRef.current) {
      return;
    }
    latchedRef.current = false;
    setLatched(false);
    void finishClip();
  }, [clearHoldTimer, finishClip, mode]);

  const handleTalk = useCallback(() => {
    if (mode !== 'talk' || heldRef.current || sending) {
      return;
    }
    if (latchedRef.current) {
      latchedRef.current = false;
      setLatched(false);
      void finishClip();
      return;
    }
    clearHoldTimer();
    heldRef.current = false;
    latchedRef.current = true;
    setLatched(true);
    setListening(true);
    void startListen();
  }, [clearHoldTimer, finishClip, mode, sending, startListen]);

  const handleChangeField = useCallback((key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    onSubmit?.(draft);
    onRequestClose?.();
  }, [draft, onRequestClose, onSubmit]);

  const headline = listening ? null : turnError || ask || caption;
  const talkHint = sending
    ? 'Sending…'
    : listening
      ? latched
        ? 'Listening… Tap to stop'
        : 'Listening… Release to send'
      : 'Tap to keep listening · Hold to talk';

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
        transcript: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.2,
          lineHeight: 20,
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
            {headline ? (
              <AppText style={styles.ask} testID="appointment-voice-caption">
                {headline}
              </AppText>
            ) : null}
            {!listening && !turnError && transcript ? (
              <AppText style={styles.transcript} testID="appointment-voice-transcript">
                {transcript}
              </AppText>
            ) : null}
            <View style={styles.orbBlock}>
              <AppointmentVoiceOrb
                accessibilityLabel="Tap to keep listening, or hold to talk"
                disabled={sending}
                listening={listening}
                size={200}
                testID="appointment-voice-talk"
                onPress={handleTalk}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
              />
              <AppText style={styles.talkHint}>{talkHint}</AppText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
