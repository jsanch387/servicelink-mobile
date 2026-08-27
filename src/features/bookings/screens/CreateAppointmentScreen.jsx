import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  HeaderTextButton,
  androidBalancedHeaderLeft,
  androidHeaderTitleBalanceRight,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { CreateAppointmentFlow } from '../create-appointment/CreateAppointmentFlow';

/**
 * Entry point for creating a booking from the home FAB.
 * Nav header uses Cancel (not Back) so leaving clearly abandons the whole booking.
 */
export function CreateAppointmentScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const prefilledCustomer = route.params?.prefilledCustomer ?? null;

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
    navigation.setOptions({
      headerLeft: androidBalancedHeaderLeft(() => (
        <HeaderTextButton
          accessibilityLabel="Cancel new appointment"
          label="Cancel"
          onPress={() => navigation.goBack()}
        />
      )),
      headerRight: androidHeaderTitleBalanceRight(),
    });

    return () => {
      navigation.setOptions({ headerShown: true, headerLeft: undefined, headerRight: undefined });
    };
  }, [navigation]);

  return (
    <View style={styles.root} testID="create-appt-screen">
      <CreateAppointmentFlow
        onImmersiveSubmitChange={handleNavigationHeaderVisibility}
        prefilledCustomer={prefilledCustomer}
      />
    </View>
  );
}
