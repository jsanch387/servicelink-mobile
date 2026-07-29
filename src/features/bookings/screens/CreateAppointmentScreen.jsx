import { useNavigation } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { CreateAppointmentFlow } from '../create-appointment/CreateAppointmentFlow';

/**
 * Entry point for creating a booking from the home FAB.
 * Nav header uses Cancel (not Back) so leaving clearly abandons the whole booking.
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
        cancelHit: {
          justifyContent: 'center',
          marginLeft: Platform.OS === 'ios' ? 4 : 0,
          paddingHorizontal: 8,
          paddingVertical: 8,
        },
        cancelLabel: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '400',
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
      headerLeft: () => (
        <Pressable
          accessibilityLabel="Cancel new appointment"
          accessibilityRole="button"
          hitSlop={8}
          style={styles.cancelHit}
          onPress={() => navigation.goBack()}
        >
          <AppText style={styles.cancelLabel}>Cancel</AppText>
        </Pressable>
      ),
    });

    return () => {
      navigation.setOptions({ headerShown: true, headerLeft: undefined });
    };
  }, [navigation, styles.cancelHit, styles.cancelLabel]);

  return (
    <View style={styles.root} testID="create-appt-screen">
      <CreateAppointmentFlow onImmersiveSubmitChange={handleNavigationHeaderVisibility} />
    </View>
  );
}
