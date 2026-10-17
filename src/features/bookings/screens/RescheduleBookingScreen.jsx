import { useNavigation } from '@react-navigation/native';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Button, InlineCardError } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { parseBookingStartLocalMs } from '../../home/utils/bookingStart';
import { BookingRescheduleForm } from '../booking-details/components/BookingRescheduleForm';
import { useBookingActions } from '../booking-details/hooks/useBookingActions';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';

/**
 * Full-screen reschedule, same pattern as Edit appointment.
 */
export function RescheduleBookingScreen({ route }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const bookingId = route?.params?.bookingId;
  const detailsQuery = useBookingDetails(bookingId);
  const bookingActions = useBookingActions(bookingId);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        center: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
        },
        errorWrap: {
          flex: 1,
          gap: 16,
          justifyContent: 'center',
          paddingHorizontal: SCREEN_GUTTER,
        },
      }),
    [colors],
  );

  const initialStartMs = useMemo(() => {
    const raw = detailsQuery.booking;
    const ms = parseBookingStartLocalMs(raw?.scheduled_date, raw?.start_time);
    return Number.isFinite(ms) ? ms : undefined;
  }, [detailsQuery.booking]);

  if (detailsQuery.errorMessage && !detailsQuery.booking) {
    return (
      <View style={styles.root}>
        <View style={styles.errorWrap}>
          <InlineCardError message={detailsQuery.errorMessage} />
          <Button
            fullWidth
            title="Go back"
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    );
  }

  if (!detailsQuery.booking) {
    return (
      <View style={styles.root}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BookingRescheduleForm
        bookingId={bookingId}
        businessId={detailsQuery.booking?.business_id ?? null}
        initialStartMs={initialStartMs}
        isSubmitting={bookingActions.isReschedulingBooking}
        onDone={() => navigation.goBack()}
        onSubmitReschedule={bookingActions.rescheduleBooking}
      />
    </View>
  );
}
