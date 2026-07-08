import { useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';
import { CreateAppointmentFlow } from '../create-appointment/CreateAppointmentFlow';

/**
 * Entry point for creating a booking from the home FAB.
 */
export function CreateAppointmentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();

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

  const handleNavigationHeaderVisibility = useCallback(
    (hideNavigationHeader) => {
      navigation.setOptions({ headerShown: !hideNavigationHeader });
    },
    [navigation],
  );

  useLayoutEffect(() => {
    return () => {
      navigation.setOptions({ headerShown: true });
    };
  }, [navigation]);

  return (
    <View style={styles.root}>
      <CreateAppointmentFlow onImmersiveSubmitChange={handleNavigationHeaderVisibility} />
    </View>
  );
}
