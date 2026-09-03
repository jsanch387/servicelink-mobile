import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InteractionManager,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Button,
  DeleteButton,
  InfoSection,
  InlineCardError,
  LocationSection,
  SurfaceCard,
  useToast,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { parseBookingStartLocalMs } from '../../home/utils/bookingStart';
import { useTheme } from '../../../theme';
import { openMapsToAddress } from '../../../utils/openMapsToAddress';
import { phoneForSmsUri } from '../../../utils/phone';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { BookingActionsMovedTip } from '../booking-details/components/BookingActionsMovedTip';
import {
  BookingActionsHeaderButton,
  BookingActionsSheet,
} from '../booking-details/components/BookingActionsSheet';
import { BookingCompleteVisitSheet } from '../booking-details/components/BookingCompleteInvoiceDesignSheet';
import { BookingJobStatusSheet } from '../booking-details/components/BookingJobStatusSheet';
import { BookingMarkCompleteSheet } from '../booking-details/components/BookingMarkCompleteSheet';
import { BookingPaymentSection } from '../booking-details/components/BookingPaymentSection';
import { BookingDetailsStatusBanner } from '../booking-details/components/BookingDetailsStatusBanner';
import { BookingRescheduleSheet } from '../booking-details/components/BookingRescheduleSheet';
import { BookingActivitySection } from '../booking-details/components/BookingActivitySection';
import { BookingDetailsSkeleton } from '../booking-details/components/BookingDetailsSkeleton';
import { BookingJobsSummarySection } from '../booking-details/components/BookingJobsSummarySection';
import { ScheduleSection } from '../booking-details/components/ScheduleSection';
import { useBookingActions } from '../booking-details/hooks/useBookingActions';
import { useBookingActionsMovedTip } from '../booking-details/hooks/useBookingActionsMovedTip';
import { useMarkBookingCompleteFlow } from '../booking-details/hooks/useMarkBookingCompleteFlow';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';
import { buildBookingDetailsModel } from '../booking-details/utils/buildBookingDetailsModel';
import { useCustomerSmsAccess } from '../../sms/hooks/useCustomerSmsAccess';
import { useMembershipVisitForBooking } from '../../subscriptions/hooks/useMembershipVisitForBooking';

export function BookingDetailsScreen({ route }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const toast = useToast();
  const bookingId = route?.params?.bookingId;
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [rescheduleSheetOpen, setRescheduleSheetOpen] = useState(false);
  const [jobStatusSheetOpen, setJobStatusSheetOpen] = useState(false);
  const [completeScrollRequestId, setCompleteScrollRequestId] = useState(0);
  const scrollRef = useRef(/** @type {ScrollView | null} */ (null));
  const detailsQuery = useBookingDetails(bookingId);
  const bookingActions = useBookingActions(bookingId);
  const smsAccess = useCustomerSmsAccess();
  const details = useMemo(
    () => buildBookingDetailsModel(detailsQuery.booking),
    [detailsQuery.booking],
  );
  const membershipVisit = useMembershipVisitForBooking({
    businessId: detailsQuery.booking?.business_id,
    bookingId,
  });
  const paymentForDisplay = useMemo(() => {
    const payment = details.payment;
    if (!payment?.visible || !membershipVisit.isMembershipVisit) return payment;
    return {
      ...payment,
      status: 'Subscription appointment',
      detail: null,
      showMembershipMark: true,
      accessibilityLabel: 'Subscription appointment. No payment due for this visit.',
    };
  }, [details.payment, membershipVisit.isMembershipVisit]);
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
  const showJobStatusAction = smsAccess.canUseSms && !isCompletedStatus && !isCancelledStatus;
  const showActionsMenu =
    !detailsQuery.isLoading &&
    !detailsQuery.errorMessage &&
    !isCancelledStatus &&
    !isCompletedStatus;
  const { visible: showActionsMovedTip, dismiss: dismissActionsMovedTip } =
    useBookingActionsMovedTip({ enabled: showActionsMenu });

  const handleOpenActions = useCallback(() => {
    if (showActionsMovedTip) {
      dismissActionsMovedTip();
    }
    setActionsSheetOpen(true);
  }, [dismissActionsMovedTip, showActionsMovedTip]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: showActionsMenu
        ? () => (
            <BookingActionsHeaderButton
              highlight={showActionsMovedTip}
              onPress={handleOpenActions}
            />
          )
        : undefined,
    });
  }, [handleOpenActions, navigation, showActionsMenu, showActionsMovedTip]);

  useEffect(() => {
    setCompleteScrollRequestId(0);
  }, [bookingId]);

  useEffect(() => {
    if (completeScrollRequestId === 0 || !isCompletedStatus) {
      return undefined;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ animated: true, y: 0 });
      });
    });
    return () => task.cancel();
  }, [completeScrollRequestId, isCompletedStatus]);

  const handleOpenMaps = useCallback(() => {
    if (!details.location.hasAddress) {
      return;
    }
    void openMapsToAddress(details.location.address, {
      noAddressMessage: 'Add an address on this booking to get directions.',
    });
  }, [details.location.address, details.location.hasAddress]);
  const handleOpenCustomer = useCallback(() => {
    const customerId = details.customer.id;
    if (!customerId) return;
    navigation.navigate(ROUTES.CUSTOMER_DETAILS, { customerId });
  }, [details.customer.id, navigation]);

  const customerSectionRows = useMemo(() => {
    const canOpenCustomer = Boolean(details.customer.id);
    const rows = [
      {
        key: 'customer-name',
        icon: 'person-outline',
        value: details.customer.name,
        emphasize: true,
        interactionStyle: 'none',
        onPress: canOpenCustomer ? handleOpenCustomer : undefined,
        accessibilityLabel: canOpenCustomer ? `View ${details.customer.name}` : undefined,
        trailing: canOpenCustomer ? (
          <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
        ) : null,
      },
    ];
    if (canOpenCustomer) return rows;

    const phoneDisplay = String(details.customer.phone ?? '').trim();
    const walkInTelUri = phoneForSmsUri(phoneDisplay);
    if (phoneDisplay.length > 0) {
      rows.push({
        key: 'customer-phone',
        icon: 'call-outline',
        value: phoneDisplay,
        onPress: walkInTelUri
          ? () => {
              void Linking.openURL(`tel:${walkInTelUri}`);
            }
          : undefined,
        accessibilityLabel: walkInTelUri ? 'Call customer' : undefined,
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
    colors.textMuted,
    details.customer.id,
    details.customer.name,
    details.customer.phone,
    details.customer.email,
    handleOpenCustomer,
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

  const handleConfirmMarkCompleted = useCallback(
    async (checkout) => {
      try {
        await markCompleteFlow.confirmComplete(checkout);
        setCompleteScrollRequestId((id) => id + 1);
      } catch (error) {
        Alert.alert(
          'Could not mark completed',
          safeUserFacingMessage(error, { fallback: 'Please try again.' }),
        );
      }
    },
    [markCompleteFlow],
  );
  const handleEditBooking = useCallback(() => {
    if (isCancelledStatus || isCompletedStatus || !bookingId) {
      return;
    }
    navigation.navigate(ROUTES.EDIT_BOOKING, { bookingId });
  }, [bookingId, isCancelledStatus, isCompletedStatus, navigation]);
  const handleOpenActivity = useCallback(() => {
    if (!bookingId) return;
    navigation.navigate(ROUTES.BOOKING_ACTIVITY, { bookingId });
  }, [bookingId, navigation]);
  const handleReschedule = useCallback(() => {
    if (isCancelledStatus || isCompletedStatus || !bookingId) {
      return;
    }
    setRescheduleSheetOpen(true);
  }, [bookingId, isCancelledStatus, isCompletedStatus]);

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
    Alert.alert(
      'Cancel this appointment?',
      'The customer will be notified by email if one is on file.',
      [
        { text: 'Keep appointment', style: 'cancel' },
        {
          text: 'Cancel appointment',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingActions.cancelBooking();
              toast.success('Appointment canceled');
            } catch (error) {
              Alert.alert(
                'Could not cancel appointment',
                safeUserFacingMessage(error, { fallback: 'Please try again.' }),
              );
            }
          },
        },
      ],
    );
  }, [bookingActions, bookingId, isCancelledStatus, isCompletedStatus, toast]);

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
          overflow: 'visible',
        },
        content: {
          gap: 22,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        errorWrap: {
          marginTop: 8,
        },
        errorRetry: {
          marginTop: 12,
        },
        notesCard: {
          borderRadius: 10,
        },
        deleteSection: {
          marginTop: 6,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      {markCompleteFlow.useCompleteVisitScreen ? (
        <BookingCompleteVisitSheet
          bookingId={bookingId}
          isLoading={markCompleteFlow.isLoadingPreview}
          loadError={markCompleteFlow.previewError}
          visitModel={markCompleteFlow.completeVisitModel}
          visible={markCompleteFlow.sheetVisible}
          onComplete={handleConfirmMarkCompleted}
          onRequestClose={markCompleteFlow.closeSheet}
        />
      ) : (
        <BookingMarkCompleteSheet
          isLoadingPreview={markCompleteFlow.isLoadingPreview}
          isSubmitting={markCompleteFlow.isConfirming}
          preview={markCompleteFlow.preview}
          previewError={markCompleteFlow.previewError}
          visible={markCompleteFlow.sheetVisible}
          onConfirm={() => void handleConfirmMarkCompleted()}
          onRequestClose={markCompleteFlow.closeSheet}
        />
      )}
      <BookingRescheduleSheet
        initialStartMs={Number.isFinite(bookingStartMs) ? bookingStartMs : undefined}
        isSubmitting={bookingActions.isReschedulingBooking}
        onSubmitReschedule={bookingActions.rescheduleBooking}
        visible={rescheduleSheetOpen}
        onRequestClose={() => setRescheduleSheetOpen(false)}
      />
      <BookingActionsSheet
        isCancelDisabled={isCancelledStatus || isCompletedStatus}
        isCancellingBooking={bookingActions.isCancellingBooking}
        isDeletingBooking={bookingActions.isDeletingBooking}
        isEditDisabled={isCancelledStatus || isCompletedStatus}
        isMarkCompletedDisabled={isCompletedStatus}
        isMarkingCompleted={markCompleteFlow.isConfirming}
        isRescheduleDisabled={isCancelledStatus || isCompletedStatus}
        isReschedulingBooking={bookingActions.isReschedulingBooking}
        showJobStatusAction={showJobStatusAction}
        visible={actionsSheetOpen}
        onCancelBooking={handleCancelBooking}
        onEdit={handleEditBooking}
        onJobStatusPress={() => setJobStatusSheetOpen(true)}
        onMarkCompleted={handleMarkCompleted}
        onRequestClose={() => setActionsSheetOpen(false)}
        onReschedule={handleReschedule}
      />
      <BookingJobStatusSheet
        bookingId={bookingId}
        businessId={detailsQuery.booking?.business_id ?? null}
        jobStatus={detailsQuery.booking?.job_status}
        visible={jobStatusSheetOpen}
        workHandoffStatus={detailsQuery.booking?.work_handoff_status}
        onRequestClose={() => setJobStatusSheetOpen(false)}
      />
      <ScrollView
        ref={scrollRef}
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

            <BookingJobsSummarySection
              formattedPrice={details.formattedPrice}
              isMembershipVisit={membershipVisit.isMembershipVisit}
              jobs={details.formattedPrice.jobs}
            />

            <ScheduleSection schedule={details.schedule} />

            <InfoSection
              bodyPadding="roomy"
              rowGap={14}
              rows={customerSectionRows}
              title="Customer"
            />

            {paymentForDisplay?.visible ? (
              <BookingPaymentSection payment={paymentForDisplay} />
            ) : null}

            {details.location.hasAddress ? (
              <LocationSection address={details.location.address} onPress={handleOpenMaps} />
            ) : null}

            {details.hasVehicle ? (
              <InfoSection
                bodyPadding="roomy"
                rowGap={14}
                rows={
                  details.vehicleRows?.length
                    ? details.vehicleRows
                    : [{ icon: 'car-sport-outline', value: details.vehicle }]
                }
                title={details.vehicleRows?.length > 1 ? 'Vehicles' : 'Vehicle'}
              />
            ) : null}

            <InfoSection
              bodyPadding="roomy"
              cardStyle={styles.notesCard}
              hideIcons
              rowGap={14}
              rows={[{ icon: 'document-text-outline', value: notesDisplay }]}
              title="Notes"
            />

            <BookingActivitySection onPress={handleOpenActivity} />
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
      {showActionsMenu && showActionsMovedTip ? (
        <BookingActionsMovedTip
          onDismiss={dismissActionsMovedTip}
          onPressActions={handleOpenActions}
        />
      ) : null}
    </SafeAreaView>
  );
}
