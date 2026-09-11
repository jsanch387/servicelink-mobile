import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { AppointmentVoiceOrb, VOICE_ORB_SIZE, voiceOrbHostPad } from './AppointmentVoiceOrb';
import { AppointmentVoiceSession } from './AppointmentVoiceSession';

const ORB_GAP_ABOVE_FOOTER = 20;
const LABEL_BLOCK = 28;
const ORB_LIFT = VOICE_ORB_SIZE + voiceOrbHostPad() / 2 + LABEL_BLOCK + ORB_GAP_ABOVE_FOOTER;

/**
 * Centers the voice orb above the wizard Back/Continue bar and owns the session modal.
 */
export function AppointmentVoiceHost({ visible = true }) {
  const { colors } = useTheme();
  const [sessionOpen, setSessionOpen] = useState(false);

  const openSession = useCallback(() => {
    setSessionOpen(true);
  }, []);

  const closeSession = useCallback(() => {
    setSessionOpen(false);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        anchor: {
          alignItems: 'center',
          left: 0,
          position: 'absolute',
          right: 0,
          top: -ORB_LIFT,
          zIndex: 20,
        },
        label: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
          marginTop: 4,
        },
      }),
    [colors],
  );

  if (!visible) {
    return null;
  }

  return (
    <>
      <View pointerEvents="box-none" style={styles.anchor}>
        <AppointmentVoiceOrb onPress={openSession} />
        <AppText style={styles.label}>Tap to speak</AppText>
      </View>
      <AppointmentVoiceSession visible={sessionOpen} onRequestClose={closeSession} />
    </>
  );
}
