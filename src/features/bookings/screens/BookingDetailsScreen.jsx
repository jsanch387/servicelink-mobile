import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function BookingDetailsScreen({ route }) {
  const { colors } = useTheme();
  const bookingId = route?.params?.bookingId;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          padding: 16,
        },
        content: {
          flex: 1,
          justifyContent: 'center',
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.25,
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          marginTop: 10,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <AppShellGlow />
      <View style={styles.content}>
        <SurfaceCard>
          <Text style={styles.title}>Booking details</Text>
          <Text style={styles.body}>
            Placeholder screen for booking details.
            {bookingId ? ` Booking ID: ${bookingId}` : ''}
          </Text>
        </SurfaceCard>
      </View>
    </SafeAreaView>
  );
}
