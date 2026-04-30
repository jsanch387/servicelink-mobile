import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';
import { CreateAppointmentFlow } from '../create-appointment/CreateAppointmentFlow';

/**
 * Entry point for creating a booking from the home FAB.
 */
export function CreateAppointmentScreen() {
  const { colors } = useTheme();

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
      <CreateAppointmentFlow />
    </View>
  );
}
