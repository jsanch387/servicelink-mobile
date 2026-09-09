import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, BetaLabel, Button, SurfaceCard } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { useTheme } from '../../../../theme';
import { AppointmentVoiceOrb } from './AppointmentVoiceOrb';
import {
  APPOINTMENT_VOICE_SLOTS,
  VOICE_LISTEN_MS,
  isVoiceDemoReady,
  nextVoiceTurnIndex,
  voiceTurnAt,
} from './appointmentVoiceDemo';

function sessionHint({ listening, ready }) {
  if (listening) {
    return 'Listening…';
  }
  if (ready) {
    return 'Looks good';
  }
  return 'Tap to talk';
}

function SlotRow({ label, value, isLast }) {
  const { colors } = useTheme();
  const filled = Boolean(value);

  return (
    <View style={[slotStyles.row, !isLast && slotStyles.rowRule, { borderBottomColor: colors.border }]}>
      <View style={slotStyles.labelCol}>
        <AppText style={[slotStyles.label, { color: colors.textMuted }]}>{label}</AppText>
      </View>
      <View style={slotStyles.valueCol}>
        <AppText
          numberOfLines={1}
          style={[slotStyles.value, { color: filled ? colors.text : colors.placeholder ?? colors.textMuted }]}
        >
          {value || '—'}
        </AppText>
      </View>
    </View>
  );
}

const slotStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  rowRule: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelCol: {
    width: 84,
  },
  valueCol: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'right',
  },
});

/**
 * Immersive voice window — grouped header, talk orb, then a single details card.
 * Demo-only: tapping the orb walks a scripted appointment conversation.
 */
export function AppointmentVoiceSession({ visible, onRequestClose, onUseDetails }) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [turnIndex, setTurnIndex] = useState(0);
  const [listening, setListening] = useState(false);
  const listenTimer = useRef(null);

  const turn = voiceTurnAt(turnIndex);
  const ready = isVoiceDemoReady(turn);

  const clearListenTimer = useCallback(() => {
    if (listenTimer.current) {
      clearTimeout(listenTimer.current);
      listenTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      clearListenTimer();
      setTurnIndex(0);
      setListening(false);
    }
  }, [clearListenTimer, visible]);

  useEffect(() => () => clearListenTimer(), [clearListenTimer]);

  const handleTalk = useCallback(() => {
    if (listening || ready) {
      return;
    }
    setListening(true);
    clearListenTimer();
    listenTimer.current = setTimeout(() => {
      setTurnIndex((current) => nextVoiceTurnIndex(current));
      setListening(false);
      listenTimer.current = null;
    }, VOICE_LISTEN_MS);
  }, [clearListenTimer, listening, ready]);

  const handleUseDetails = useCallback(() => {
    onUseDetails?.();
    onRequestClose?.();
  }, [onRequestClose, onUseDetails]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
        },
        header: {
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: insets.top + 20,
        },
        headerTop: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 18,
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
        heading: {
          gap: 6,
          paddingBottom: 8,
        },
        titleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 8,
        },
        title: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '700',
          letterSpacing: -0.6,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          lineHeight: 22,
        },
        body: {
          flex: 1,
          gap: 20,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 22,
        },
        prompt: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '600',
          letterSpacing: -0.4,
          lineHeight: 28,
        },
        heard: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
          lineHeight: 21,
          marginTop: 8,
        },
        orbBlock: {
          alignItems: 'center',
        },
        talkHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
          marginTop: 4,
        },
        detailsTitle: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.6,
          marginBottom: 6,
          textTransform: 'uppercase',
        },
        detailsCard: {
          paddingHorizontal: 16,
          paddingVertical: 4,
        },
        footer: {
          paddingTop: 4,
        },
      }),
    [colors, insets.top],
  );

  return (
    <Modal
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <LinearGradient
        colors={
          isDark ? ['#120f1c', '#0a0a0a', '#0a0a0a'] : ['#ece8f7', '#f5f5f5', '#f5f5f5']
        }
        style={styles.safe}
      >
        <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safe}>
          <View style={styles.header}>
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
            <View style={styles.heading}>
              <View style={styles.titleRow}>
                <AppText style={styles.title}>Talk to book</AppText>
              </View>
              <AppText style={styles.subtitle}>
                Just say the appointment. I’ll ask if anything’s missing.
              </AppText>
            </View>
          </View>

          <View style={styles.body}>
            <View>
              <AppText style={styles.prompt}>{turn.ai}</AppText>
              {turn.user ? <AppText style={styles.heard}>You said “{turn.user}”</AppText> : null}
            </View>

            <View style={styles.orbBlock}>
              <AppointmentVoiceOrb
                accessibilityLabel={ready ? 'Appointment details ready' : 'Tap to talk'}
                disabled={ready}
                listening={listening}
                ready={ready}
                size={132}
                testID="appointment-voice-talk"
                onPress={handleTalk}
              />
              <AppText style={styles.talkHint}>{sessionHint({ listening, ready })}</AppText>
            </View>

            <View>
              <AppText style={styles.detailsTitle}>So far</AppText>
              <SurfaceCard padding="none" style={styles.detailsCard}>
                {APPOINTMENT_VOICE_SLOTS.map((slot, index) => (
                  <SlotRow
                    key={slot.key}
                    isLast={index === APPOINTMENT_VOICE_SLOTS.length - 1}
                    label={slot.label}
                    value={turn.slots[slot.key]}
                  />
                ))}
              </SurfaceCard>
              {ready ? (
                <View style={styles.footer}>
                  <Button
                    fullWidth
                    testID="appointment-voice-use-details"
                    title="Use these details"
                    variant="primary"
                    onPress={handleUseDetails}
                  />
                </View>
              ) : null}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}
