import { StyleSheet, View } from 'react-native';
import { SuccessMoment } from '../../../../components/ui';

/**
 * @param {object} props
 * @param {string | number} [props.replayKey]
 */
export function AppointmentConfirmedStep({ replayKey = 'default' }) {
  return (
    <View style={styles.root}>
      <SuccessMoment
        body="You’re all set—it’s on your calendar. Check Bookings for details."
        centered
        iconAccessibilityLabel="Appointment confirmed"
        replayKey={replayKey}
        title="Appointment confirmed"
        variant="inline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'stretch',
    flex: 1,
    width: '100%',
  },
});
