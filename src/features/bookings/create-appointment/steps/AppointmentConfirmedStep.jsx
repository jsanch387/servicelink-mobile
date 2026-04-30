import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function AppointmentConfirmedStep() {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          paddingHorizontal: 8,
          paddingTop: 24,
        },
        icon: {
          marginBottom: 20,
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.35,
          marginBottom: 10,
          textAlign: 'center',
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <View accessibilityLabel="Success" accessibilityRole="image" style={styles.icon}>
        <Ionicons color={colors.accent} name="checkmark-circle" size={56} />
      </View>
      <AppText style={styles.title}>Appointment confirmed</AppText>
      <AppText style={styles.body}>
        The appointment was saved to your schedule. You can change or cancel it from Bookings any
        time.
      </AppText>
    </View>
  );
}
