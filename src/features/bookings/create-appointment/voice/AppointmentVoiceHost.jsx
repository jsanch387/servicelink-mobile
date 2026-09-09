import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { AppointmentVoiceOrb, VOICE_ORB_SIZE, voiceOrbHostPad } from './AppointmentVoiceOrb';
import { AppointmentVoiceSession } from './AppointmentVoiceSession';

const ORB_GAP_ABOVE_FOOTER = 12;
const ORB_LIFT = VOICE_ORB_SIZE + voiceOrbHostPad() / 2 + ORB_GAP_ABOVE_FOOTER;

/**
 * Pins the voice orb just above the wizard Back/Continue bar and owns the session modal.
 */
export function AppointmentVoiceHost({ visible = true }) {
  const [sessionOpen, setSessionOpen] = useState(false);

  const openSession = useCallback(() => {
    setSessionOpen(true);
  }, []);

  const closeSession = useCallback(() => {
    setSessionOpen(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <>
      <View pointerEvents="box-none" style={styles.anchor}>
        <AppointmentVoiceOrb onPress={openSession} />
      </View>
      <AppointmentVoiceSession visible={sessionOpen} onRequestClose={closeSession} />
    </>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    right: SCREEN_GUTTER - 10,
    top: -ORB_LIFT,
    zIndex: 20,
  },
});
