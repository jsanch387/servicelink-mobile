import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  InteractionManager,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AppText, Button, InlineCardError, SurfaceCard, useToast } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { openMapsToAddress } from '../../../utils/openMapsToAddress';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { BookingActionsMovedTip } from '../booking-details/components/BookingActionsMovedTip';
import {
  BookingActionsHeaderButton,
  BookingActionsSheet,
} from '../booking-details/components/BookingActionsSheet';
import { BookingCompleteVisitSheet } from '../booking-details/components/BookingCompleteInvoiceDesignSheet';
import { BookingJobStatusSheet } from '../booking-details/components/BookingJobStatusSheet';
import { BookingMarkCompleteSheet } from '../booking-details/components/BookingMarkCompleteSheet';
import { BookingCustomerCard } from '../booking-details/components/BookingCustomerCard';
import { BookingDetailsHero } from '../booking-details/components/BookingDetailsHero';
import { BookingDetailsMetaSection } from '../booking-details/components/BookingDetailsMetaSection';
import { BookingNotesSheet } from '../booking-details/components/BookingNotesSheet';
import { BookingDetailsSkeleton } from '../booking-details/components/BookingDetailsSkeleton';
import { BookingJobsSummarySection } from '../booking-details/components/BookingJobsSummarySection';
import { BookingLocationCard } from '../booking-details/components/BookingLocationCard';
import { BookingAssigneeSection } from '../assignee/components/BookingAssigneeSection';
import { readAssignedUserId } from '../assignee/utils/readAssignedUserId';
import { useBookingActions } from '../booking-details/hooks/useBookingActions';
import { isAppointmentRequestExpiredError } from '../api/patchApproveAvailabilityBooking';
import { useBookingActionsMovedTip } from '../booking-details/hooks/useBookingActionsMovedTip';
import { useMarkBookingCompleteFlow } from '../booking-details/hooks/useMarkBookingCompleteFlow';
import { useBookingDetails } from '../booking-details/hooks/useBookingDetails';
import { useUpdateBookingNotes } from '../booking-details/hooks/useUpdateBookingNotes';
import { bookingRequestState } from '../booking-details/utils/bookingRequestState';
import { buildBookingDetailsModel } from '../booking-details/utils/buildBookingDetailsModel';
import { useShopAccess } from '../../shop';
import { useCustomerSmsAccess } from '../../sms/hooks/useCustomerSmsAccess';
import { useMembershipVisitForBooking } from '../../subscriptions/hooks/useMembershipVisitForBooking';

export function BookingDetailsScreen({ route }) {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const toast = useToast();
  const bookingId = route?.params?.bookingId;
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [jobStatusSheetOpen, setJobStatusSheetOpen] = useState(false);
  const [notesSheetOpen, setNotesSheetOpen] = useState(false);
  const [completeScrollRequestId, setCompleteScrollRequestId] = useState(0);
  const scrollRef = useRef(/** @type {ScrollView | null} */ (null));
  const detailsQuery = useBookingDetails(bookingId);
  const notesSave = useUpdateBookingNotes(bookingId, detailsQuery.booking?.business_id);
  const bookingActions = useBookingActions(bookingId);
  const { canDeleteBookings, canWriteBookings } = useShopAccess();
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
  const isConfirmedStatus = statusLower === 'confirmed';
  const requestState = useMemo(
    () =>
      bookingRequestState({
        status: details.status,
        scheduledDate: detailsQuery.booking?.scheduled_date,
      }),
    [details.status, detailsQuery.booking?.scheduled_date],
  );
  const isAppointmentRequest = requestState.kind !== 'none';
  const showJobStatusAction =
    smsAccess.canUseSms && !isCompletedStatus && !isCancelledStatus && !isAppointmentRequest;
  const bookingIsOpen = !isCancelledStatus && !isCompletedStatus;
  const showCompleteAction = bookingIsOpen && !isAppointmentRequest;
  const showActionsMenu =
    !detailsQuery.isLoading &&
    !detailsQuery.errorMessage &&
    ((bookingIsOpen && (canWriteBookings || showJobStatusAction)) || canDeleteBookings);
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

  const notesDisplay = useMemo(() => String(details.notes ?? '').trim(), [details.notes]);
  const scheduleSubtitle = useMemo(() => {
    const time = String(details.schedule.timeRange || details.schedule.time || '').trim();
    const duration = String(details.schedule.duration || '').trim();
    return [time, duration].filter(Boolean).join(' · ');
  }, [details.schedule.duration, details.schedule.time, details.schedule.timeRange]);
  const jobCount = details.formattedPrice.jobs?.length ?? 0;
  const sharedVehicleOnCard = details.hasVehicle && jobCount <= 1 ? details.vehicle : '';
  const sharedVehicleInMeta = details.hasVehicle && jobCount > 1 ? details.vehicle : '';
  const canEditBooking = canWriteBookings && !isCancelledStatus && !isCompletedStatus;

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
  const handleOpenNotes = useCallback(() => {
    if (!canEditBooking || !bookingId) {
      return;
    }
    notesSave.resetSaveError();
    setNotesSheetOpen(true);
  }, [bookingId, canEditBooking, notesSave]);
  const handleSaveNotes = useCallback(
    async (nextNotes) => {
      try {
        await notesSave.saveNotes(nextNotes);
        setNotesSheetOpen(false);
      } catch {
        // The sheet stays open and shows the save error.
      }
    },
    [notesSave],
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
    if (!isConfirmedStatus || !canWriteBookings || !bookingId) {
      return;
    }
    navigation.navigate(ROUTES.RESCHEDULE_BOOKING, { bookingId });
  }, [bookingId, canWriteBookings, isConfirmedStatus, navigation]);

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

  const handleApproveBooking = useCallback(async () => {
    if (
      requestState.kind !== 'pending' ||
      !bookingId ||
      bookingActions.isApprovingBooking ||
      bookingActions.isDenyingBooking
    ) {
      return;
    }
    try {
      await bookingActions.approveBooking();
      toast.success('Appointment confirmed');
    } catch (error) {
      if (isAppointmentRequestExpiredError(error)) {
        return;
      }
      Alert.alert(
        'Could not approve appointment',
        safeUserFacingMessage(error, { fallback: 'Please try again.' }),
      );
    }
  }, [bookingActions, bookingId, requestState.kind, toast]);

  const handleDenyBooking = useCallback(() => {
    if (
      requestState.kind !== 'pending' ||
      !bookingId ||
      bookingActions.isApprovingBooking ||
      bookingActions.isDenyingBooking
    ) {
      return;
    }
    Alert.alert(
      'Deny request?',
      'The customer will be told this time was not confirmed, and the slot will open back up.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Deny request',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingActions.denyBooking();
              toast.success('Request denied');
            } catch (error) {
              if (isAppointmentRequestExpiredError(error)) {
                return;
              }
              Alert.alert(
                'Could not deny request',
                safeUserFacingMessage(error, { fallback: 'Please try again.' }),
              );
            }
          },
        },
      ],
    );
  }, [bookingActions, bookingId, requestState.kind, toast]);

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
    bookingActions.isApprovingBooking ||
    bookingActions.isDenyingBooking ||
    bookingActions.isCancellingBooking ||
    markCompleteFlow.isConfirming ||
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
        contentWithDock: {
          paddingBottom: 16,
        },
        scroll: {
          flex: 1,
        },
        completeBar: {
          backgroundColor: colors.shell,
          paddingBottom: 8,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
        requestCopy: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '400',
          letterSpacing: -0.15,
          lineHeight: 21,
        },
        requestActions: {
          columnGap: 10,
          flexDirection: 'row',
          width: '100%',
        },
        requestActionCell: {
          flex: 1,
          minWidth: 0,
        },
        errorWrap: {
          marginTop: 8,
        },
        errorRetry: {
          marginTop: 12,
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
      <BookingActionsSheet
        canDeleteBookings={canDeleteBookings}
        canWriteBookings={canWriteBookings}
        isCancelDisabled={isCancelledStatus || isCompletedStatus}
        isCancellingBooking={bookingActions.isCancellingBooking}
        isDeletingBooking={bookingActions.isDeletingBooking}
        isEditDisabled={isCancelledStatus || isCompletedStatus}
        isRescheduleDisabled={!isConfirmedStatus}
        showCancelAction={!isAppointmentRequest}
        showJobStatusAction={showJobStatusAction}
        showRescheduleAction={!isAppointmentRequest}
        visible={actionsSheetOpen}
        onCancelBooking={handleCancelBooking}
        onDeleteBooking={handleDeleteBooking}
        onEdit={handleEditBooking}
        onJobStatusPress={() => setJobStatusSheetOpen(true)}
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
      <BookingNotesSheet
        errorMessage={notesSave.saveError}
        notes={notesDisplay}
        saving={notesSave.isSaving}
        visible={notesSheetOpen}
        onRequestClose={() => {
          if (notesSave.isSaving) return;
          notesSave.resetSaveError();
          setNotesSheetOpen(false);
        }}
        onSave={(nextNotes) => {
          void handleSaveNotes(nextNotes);
        }}
      />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          (showCompleteAction || isAppointmentRequest) && styles.contentWithDock,
        ]}
        refreshControl={detailsRefreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
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
            <BookingDetailsHero
              date={details.schedule.headlineDate || details.schedule.date}
              status={details.status}
              subtitle={scheduleSubtitle}
            />

            <BookingJobsSummarySection
              formattedPrice={details.formattedPrice}
              isMembershipVisit={membershipVisit.isMembershipVisit}
              jobs={details.formattedPrice.jobs}
              payment={paymentForDisplay}
              sharedVehicle={sharedVehicleOnCard}
            />

            {details.location.hasAddress ? (
              <BookingLocationCard location={details.location} onOpenMaps={handleOpenMaps} />
            ) : null}

            <BookingCustomerCard
              customer={details.customer}
              onOpenCustomer={details.customer.id ? handleOpenCustomer : undefined}
            />

            <BookingDetailsMetaSection
              assignee={
                <BookingAssigneeSection
                  assignedUserId={readAssignedUserId(detailsQuery.booking)}
                  bookingId={bookingId}
                  bookingStatus={details.status}
                  layout="meta"
                />
              }
              notes={notesDisplay}
              vehicle={sharedVehicleInMeta}
              onActivityPress={handleOpenActivity}
              onNotesPress={canEditBooking ? handleOpenNotes : undefined}
            />
          </>
        ) : null}
      </ScrollView>
      {showCompleteAction && !detailsQuery.isLoading && !detailsQuery.errorMessage ? (
        <View style={styles.completeBar}>
          <Button
            accessibilityHint="Review this visit before marking it complete"
            accessibilityLabel="Mark complete"
            disabled={actionsBusy || !bookingId}
            fullWidth
            iconName="checkmark"
            loading={markCompleteFlow.isConfirming}
            title="Mark complete"
            onPress={handleMarkCompleted}
          />
        </View>
      ) : null}
      {isAppointmentRequest && !detailsQuery.isLoading && !detailsQuery.errorMessage ? (
        <View style={styles.completeBar}>
          {requestState.kind === 'pending' ? (
            <View style={styles.requestActions}>
              <View style={styles.requestActionCell}>
                <Button
                  accessibilityLabel="Deny"
                  disabled={bookingActions.isApprovingBooking || !bookingId}
                  fullWidth
                  loading={bookingActions.isDenyingBooking}
                  title="Deny"
                  variant="danger"
                  onPress={handleDenyBooking}
                />
              </View>
              <View style={styles.requestActionCell}>
                <Button
                  accessibilityLabel="Approve"
                  disabled={bookingActions.isDenyingBooking || !bookingId}
                  fullWidth
                  loading={bookingActions.isApprovingBooking}
                  title="Approve"
                  onPress={() => {
                    void handleApproveBooking();
                  }}
                />
              </View>
            </View>
          ) : (
            <AppText style={styles.requestCopy}>{requestState.message}</AppText>
          )}
        </View>
      ) : null}
      {showActionsMenu && showActionsMovedTip ? (
        <BookingActionsMovedTip
          onDismiss={dismissActionsMovedTip}
          onPressActions={handleOpenActions}
        />
      ) : null}
    </SafeAreaView>
  );
}
