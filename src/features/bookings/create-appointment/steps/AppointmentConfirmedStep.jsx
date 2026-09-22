import { StyleSheet, View } from 'react-native';
import { SuccessMoment } from '../../../../components/ui';

/**
 * @param {object} props
 * @param {string | number} [props.replayKey]
 */
export function AppointmentConfirmedStep({ replayKey = 'default' }) {
  return (
    <View style={styles.root} testID="create-appt-confirmed">
      <SuccessMoment
        body="It's on your calendar."
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
