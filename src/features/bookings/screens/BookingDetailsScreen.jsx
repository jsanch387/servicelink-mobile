import { useCallback, useMemo } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, InfoSection, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { BookingActionsSection } from '../booking-details/components/BookingActionsSection';
import { BookingDetailsSkeleton } from '../booking-details/components/BookingDetailsSkeleton';
import { PriceBreakdownSection } from '../booking-details/components/PriceBreakdownSection';
import { ScheduleSection } from '../booking-details/components/ScheduleSection';
import { useBookingActions } from '../booking-details/hooks/useBookingActions';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';
import { buildBookingDetailsModel } from '../booking-details/utils/buildBookingDetailsModel';

export function BookingDetailsScreen({ route }) {
  const { colors } = useTheme();
  const bookingId = route?.params?.bookingId;
  const detailsQuery = useBookingDetails(bookingId);
  const bookingActions = useBookingActions(bookingId);
  const details = useMemo(
    () => buildBookingDetailsModel(detailsQuery.booking),
    [detailsQuery.booking],
  );
  const isCompletedStatus = details.status.toLowerCase() === 'completed';
  const isCancelledStatus = details.status.toLowerCase() === 'cancelled';
  const customerPhoneDigits = useMemo(
    () => String(details.customer.phone ?? '').replace(/\D/g, ''),
    [details.customer.phone],
  );
  const hasCallablePhone = customerPhoneDigits.length >= 10;
  const handleOpenMaps = useCallback(async () => {
    if (!details.location.hasAddress) {
      return;
    }
    const address = details.location.address?.trim();
    const encoded = encodeURIComponent(address);
    const mapsUrl = `https://maps.apple.com/?q=${encoded}`;
    const canOpen = await Linking.canOpenURL(mapsUrl);
    if (!canOpen) {
      Alert.alert('Unable to open maps', 'No maps application is available on this device.');
      return;
    }
    await Linking.openURL(mapsUrl);
  }, [details.location.address, details.location.hasAddress]);
  const handleCallCustomer = useCallback(async () => {
    if (!hasCallablePhone) {
      Alert.alert(
        'No phone number',
        'A valid customer phone number is not available for this booking.',
      );
      return;
    }
    const telUrl = `tel:${customerPhoneDigits}`;
    const canOpen = await Linking.canOpenURL(telUrl);
    if (!canOpen) {
      Alert.alert('Unable to open dialer', 'This device cannot open the phone dialer.');
      return;
    }
    await Linking.openURL(telUrl);
  }, [customerPhoneDigits, hasCallablePhone]);
  const handleMarkCompleted = useCallback(async () => {
    if (isCompletedStatus || isCancelledStatus || !bookingId) {
      return;
    }
    try {
      await bookingActions.markCompleted();
    } catch (error) {
      Alert.alert(
        'Could not mark completed',
        safeUserFacingMessage(error, { fallback: 'Please try again.' }),
      );
    }
  }, [bookingActions, bookingId, isCancelledStatus, isCompletedStatus]);
  const handleCancelBooking = useCallback(() => {
    if (isCancelledStatus || isCompletedStatus || !bookingId) {
      return;
    }
    Alert.alert('Cancel booking?', 'This will mark the booking as cancelled.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          try {
            await bookingActions.cancelBooking();
          } catch (error) {
            Alert.alert(
              'Could not cancel booking',
              safeUserFacingMessage(error, { fallback: 'Please try again.' }),
            );
          }
        },
      },
    ]);
  }, [bookingActions, bookingId, isCancelledStatus, isCompletedStatus]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        content: {
          paddingBottom: 34,
          paddingHorizontal: 16,
          paddingTop: 14,
          rowGap: 16,
        },
        actionsWrap: {
          marginTop: 4,
        },
        errorWrap: {
          marginTop: 8,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {detailsQuery.isLoading ? <BookingDetailsSkeleton /> : null}

        {detailsQuery.errorMessage ? (
          <View style={styles.errorWrap}>
            <SurfaceCard>
              <InlineCardError message={detailsQuery.errorMessage} />
            </SurfaceCard>
          </View>
        ) : null}

        {!detailsQuery.isLoading && !detailsQuery.errorMessage ? (
          <>
            <ScheduleSection schedule={details.schedule} />

            <InfoSection
              rows={[
                { icon: 'person-outline', value: details.customer.name, emphasize: true },
                {
                  icon: 'call-outline',
                  value: details.customer.phone,
                  onPress: hasCallablePhone ? handleCallCustomer : undefined,
                  accessibilityLabel: hasCallablePhone ? 'Call customer' : undefined,
                },
                { icon: 'mail-outline', value: details.customer.email },
              ]}
              title="Customer"
            />

            <PriceBreakdownSection formattedPrice={details.formattedPrice} />

            <InfoSection
              rows={[{ icon: 'location-outline', value: details.location.address }]}
              footer={
                <Button
                  disabled={!details.location.hasAddress}
                  fullWidth
                  iconName="navigate-outline"
                  onPress={handleOpenMaps}
                  title="Open in Maps"
                  variant="secondary"
                />
              }
              title="Location"
            />

            <InfoSection
              rows={[{ icon: 'car-sport-outline', value: details.vehicle }]}
              title="Vehicle"
            />

            <InfoSection
              rows={[{ icon: 'document-text-outline', value: details.notes }]}
              title="Notes"
              hideIcons
            />

            <View style={styles.actionsWrap}>
              <BookingActionsSection
                isCancelDisabled={isCancelledStatus || isCompletedStatus}
                isCancellingBooking={bookingActions.isCancellingBooking}
                isMarkCompletedDisabled={isCompletedStatus}
                isMarkingCompleted={bookingActions.isMarkingCompleted}
                onCancelBooking={handleCancelBooking}
                onMarkCompleted={handleMarkCompleted}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
