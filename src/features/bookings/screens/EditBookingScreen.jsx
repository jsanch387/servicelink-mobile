import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';
import { EditAppointmentFlow } from '../edit-appointment/EditAppointmentFlow';

/**
 * Entry point for editing a booking from booking details.
 */
export function EditBookingScreen({ route }) {
  const { colors } = useTheme();
  const bookingId = route?.params?.bookingId;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <EditAppointmentFlow bookingId={bookingId} />
    </View>
  );
}
