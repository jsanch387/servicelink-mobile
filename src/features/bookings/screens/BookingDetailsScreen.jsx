import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Button,
  DeleteButton,
  InfoSection,
  InlineCardError,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { parseBookingStartLocalMs } from '../../home/utils/bookingStart';
import { isOnTheWayActionDone } from '../constants/jobStatus';
import { useBookingAction } from '../hooks/useBookingAction';
import { useTheme } from '../../../theme';
import { phoneForSmsUri } from '../../../utils/phone';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { BookingActionsSection } from '../booking-details/components/BookingActionsSection';
import { BookingMarkCompleteSheet } from '../booking-details/components/BookingMarkCompleteSheet';
import { BookingPaymentSection } from '../booking-details/components/BookingPaymentSection';
import { BookingDetailsStatusBanner } from '../booking-details/components/BookingDetailsStatusBanner';
import { BookingRescheduleSheet } from '../booking-details/components/BookingRescheduleSheet';
import { BookingDetailsSkeleton } from '../booking-details/components/BookingDetailsSkeleton';
import { PriceBreakdownSection } from '../booking-details/components/PriceBreakdownSection';
import { ScheduleSection } from '../booking-details/components/ScheduleSection';
import { useBookingActions } from '../booking-details/hooks/useBookingActions';
import { useMarkBookingCompleteFlow } from '../booking-details/hooks/useMarkBookingCompleteFlow';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';
import { buildBookingDetailsModel } from '../booking-details/utils/buildBookingDetailsModel';

export function BookingDetailsScreen({ route }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const bookingId = route?.params?.bookingId;
  const [rescheduleSheetOpen, setRescheduleSheetOpen] = useState(false);
  const detailsQuery = useBookingDetails(bookingId);
  const bookingActions = useBookingActions(bookingId);
  const details = useMemo(
    () => buildBookingDetailsModel(detailsQuery.booking),
    [detailsQuery.booking],
  );
  const markCompleteFlow = useMarkBookingCompleteFlow(bookingId, {
    booking: detailsQuery.booking
      ? {
          id: detailsQuery.booking.id,
          customer_id: detailsQuery.booking.customer_id ?? null,
          customer_email: detailsQuery.booking.customer_email ?? null,
          customer_phone: detailsQuery.booking.customer_phone ?? null,
          customer_name: detailsQuery.booking.customer_name ?? null,
        }
      : null,
  });
  const statusLower = details.status.toLowerCase();
  const isCompletedStatus = statusLower === 'completed' || statusLower === 'complete';
  const isCancelledStatus = statusLower === 'cancelled' || statusLower === 'canceled';
  const isConfirmedStatus = statusLower === 'confirmed';
  const showOnMyWayAction = isConfirmedStatus && !isCompletedStatus && !isCancelledStatus;
  const hasCustomerSmsPhone = Boolean(phoneForSmsUri(detailsQuery.booking?.customer_phone));
  const bookingAction = useBookingAction(null);
  const onMyWayAlreadySent =
    isOnTheWayActionDone(detailsQuery.booking) || bookingAction.isOnTheWayDone(bookingId);
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

  const customerSectionRows = useMemo(() => {
    const rows = [
      {
        key: 'customer-name',
        icon: 'person-outline',
        value: details.customer.name,
        emphasize: true,
      },
    ];
    const phoneDisplay = String(details.customer.phone ?? '').trim();
    if (phoneDisplay.length > 0) {
      rows.push({
        key: 'customer-phone',
        icon: 'call-outline',
        value: phoneDisplay,
        onPress: hasCallablePhone ? handleCallCustomer : undefined,
        accessibilityLabel: hasCallablePhone ? 'Call customer' : undefined,
      });
    }
    const emailDisplay = String(details.customer.email ?? '').trim();
    if (emailDisplay.length > 0) {
      rows.push({
        key: 'customer-email',
        icon: 'mail-outline',
        value: emailDisplay,
      });
    }
    return rows;
  }, [
    details.customer.name,
    details.customer.phone,
    details.customer.email,
    hasCallablePhone,
    handleCallCustomer,
  ]);

  const notesDisplay = useMemo(() => {
    const n = String(details.notes ?? '').trim();
    return n.length > 0 ? n : 'No notes';
  }, [details.notes]);

  const handleMarkCompleted = useCallback(() => {
    if (isCompletedStatus || isCancelledStatus || !bookingId) {
      return;
    }
    markCompleteFlow.openSheet();
  }, [bookingId, isCancelledStatus, isCompletedStatus, markCompleteFlow]);

  const handleConfirmMarkCompleted = useCallback(async () => {
    try {
      await markCompleteFlow.confirmComplete();
    } catch (error) {
      Alert.alert(
        'Could not mark completed',
        safeUserFacingMessage(error, { fallback: 'Please try again.' }),
      );
    }
  }, [markCompleteFlow]);
  const handleReschedule = useCallback(() => {
    if (isCancelledStatus || isCompletedStatus || !bookingId) {
      return;
    }
    setRescheduleSheetOpen(true);
  }, [bookingId, isCancelledStatus, isCompletedStatus]);

  const handleOnMyWay = useCallback(() => {
    if (!bookingId || onMyWayAlreadySent || bookingAction.disabled) {
      return;
    }
    bookingAction.notifyOnTheWay(bookingId);
  }, [bookingId, onMyWayAlreadySent, bookingAction]);

  const bookingStartMs = useMemo(() => {
    const raw = detailsQuery.booking;
    return parseBookingStartLocalMs(raw?.scheduled_date, raw?.start_time);
  }, [detailsQuery.booking]);

  const detailsRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void detailsQuery.refetch()}
        refreshing={Boolean(detailsQuery.isFetching && !detailsQuery.isLoading)}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, detailsQuery],
  );

  const handleCancelBooking = useCallback(() => {
    if (isCancelledStatus || isCompletedStatus || !bookingId) {
      return;
    }
    Alert.alert('Cancel booking?', 'This will mark the booking as canceled.', [
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

  const actionsBusy =
    bookingActions.isCancellingBooking ||
    markCompleteFlow.isConfirming ||
    bookingActions.isReschedulingBooking ||
    bookingActions.isDeletingBooking;

  const handleDeleteBooking = useCallback(() => {
    if (!bookingId || actionsBusy) {
      return;
    }
    Alert.alert(
      'Delete this appointment?',
      "It will be removed from your calendar. This can't be undone.",
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingActions.deleteBooking();
              navigation.goBack();
            } catch (error) {
              Alert.alert(
                'Could not delete booking',
                safeUserFacingMessage(error, { fallback: 'Please try again.' }),
              );
            }
          },
        },
      ],
    );
  }, [actionsBusy, bookingActions, bookingId, navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        content: {
          gap: 22,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        actionsWrap: {
          marginTop: 4,
        },
        errorWrap: {
          marginTop: 8,
        },
        errorRetry: {
          marginTop: 12,
        },
        deleteSection: {
          marginTop: 6,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <BookingMarkCompleteSheet
        isLoadingPreview={markCompleteFlow.isLoadingPreview}
        isSubmitting={markCompleteFlow.isConfirming}
        preview={markCompleteFlow.preview}
        previewError={markCompleteFlow.previewError}
        visible={markCompleteFlow.sheetVisible}
        onConfirm={() => void handleConfirmMarkCompleted()}
        onRequestClose={markCompleteFlow.closeSheet}
      />
      <BookingRescheduleSheet
        initialStartMs={Number.isFinite(bookingStartMs) ? bookingStartMs : undefined}
        isSubmitting={bookingActions.isReschedulingBooking}
        onSubmitReschedule={bookingActions.rescheduleBooking}
        visible={rescheduleSheetOpen}
        onRequestClose={() => setRescheduleSheetOpen(false)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={detailsRefreshControl}
        showsVerticalScrollIndicator={false}
      >
        {detailsQuery.isLoading ? <BookingDetailsSkeleton /> : null}

        {detailsQuery.errorMessage ? (
          <View style={styles.errorWrap}>
            <SurfaceCard>
              <InlineCardError message={detailsQuery.errorMessage} />
              <Button
                accessibilityHint="Attempts to load this booking again"
                accessibilityLabel="Try again"
                fullWidth
                loading={Boolean(detailsQuery.isFetching && !detailsQuery.isLoading)}
                style={styles.errorRetry}
                title="Try again"
                variant="secondary"
                onPress={() => void detailsQuery.refetch()}
              />
            </SurfaceCard>
          </View>
        ) : null}

        {!detailsQuery.isLoading && !detailsQuery.errorMessage ? (
          <>
            <BookingDetailsStatusBanner
              isCanceled={isCancelledStatus}
              isCompleted={isCompletedStatus}
            />

            <ScheduleSection schedule={details.schedule} />

            <InfoSection
              bodyPadding="roomy"
              rowGap={14}
              rows={customerSectionRows}
              title="Customer"
            />

            {details.payment.visible ? <BookingPaymentSection payment={details.payment} /> : null}

            <PriceBreakdownSection formattedPrice={details.formattedPrice} />

            {details.location.hasAddress ? (
              <InfoSection
                bodyPadding="roomy"
                footer={
                  <Button
                    fullWidth
                    iconName="navigate-outline"
                    onPress={handleOpenMaps}
                    title="Open in Maps"
                    variant="secondary"
                  />
                }
                rowGap={14}
                rows={[{ icon: 'location-outline', value: details.location.address }]}
                title="Location"
              />
            ) : null}

            {details.hasVehicle ? (
              <InfoSection
                bodyPadding="roomy"
                rowGap={14}
                rows={[{ icon: 'car-sport-outline', value: details.vehicle }]}
                title="Vehicle"
              />
            ) : null}

            <InfoSection
              bodyPadding="roomy"
              hideIcons
              rowGap={14}
              rows={[{ icon: 'document-text-outline', value: notesDisplay }]}
              title="Notes"
            />

            <View style={styles.actionsWrap}>
              <BookingActionsSection
                hasCustomerSmsPhone={hasCustomerSmsPhone}
                isCancelDisabled={isCancelledStatus || isCompletedStatus}
                isCancellingBooking={bookingActions.isCancellingBooking}
                isDeletingBooking={bookingActions.isDeletingBooking}
                isMarkCompletedDisabled={isCompletedStatus}
                isMarkingCompleted={markCompleteFlow.isConfirming}
                isOnMyWayDisabled={bookingAction.disabled}
                isOnMyWaySending={bookingAction.isSending}
                isRescheduleDisabled={isCancelledStatus || isCompletedStatus}
                isReschedulingBooking={bookingActions.isReschedulingBooking}
                onMyWayAlreadySent={onMyWayAlreadySent}
                onCancelBooking={handleCancelBooking}
                onMarkCompleted={handleMarkCompleted}
                onOnMyWayPress={handleOnMyWay}
                onReschedule={handleReschedule}
                showOnMyWayAction={showOnMyWayAction}
              />
            </View>
            <View style={styles.deleteSection}>
              <DeleteButton
                accessibilityHint="Removes this appointment from your calendar. This can\'t be undone."
                accessibilityLabel="Delete booking permanently"
                disabled={actionsBusy || !bookingId}
                loading={bookingActions.isDeletingBooking}
                title="Delete booking"
                onPress={handleDeleteBooking}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
