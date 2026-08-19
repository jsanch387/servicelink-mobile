import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InlineCardError, SurfaceCard, useToast } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { navigateNestedTabScreen } from '../../../navigation/navigateNestedTabScreen';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { CustomerNotesSection } from '../../customers/customer-details/components/CustomerNotesSection';
import { SubscriberCustomerCard } from '../components/SubscriberCustomerCard';
import { SubscriptionDetailActions } from '../components/SubscriptionDetailActions';
import { SubscriptionDetailBody } from '../components/SubscriptionDetailBody';
import { SubscriptionDetailSkeleton } from '../components/SubscriptionDetailSkeleton';
import { CANCEL_MEMBERSHIP_NOW, CANCEL_MEMBERSHIP_PERIOD_END } from '../api/postCancelMembership';
import { updateMembershipSubscriberNotes } from '../api/updateMembershipSubscriberNotes';
import {
  SUBSCRIPTION_CANCEL_ALERT_MESSAGE,
  SUBSCRIPTION_CANCEL_ALERT_TITLE,
  SUBSCRIPTION_CANCEL_KEEP,
  SUBSCRIPTION_CANCEL_NOW,
  SUBSCRIPTION_CANCEL_PERIOD_END,
  SUBSCRIPTION_DETAIL_NOT_FOUND,
  SUBSCRIPTION_REBOOK_NO_CONTACT,
} from '../constants';
import { useCancelMembership } from '../hooks/useCancelMembership';
import { useMembershipSubscriber } from '../hooks/useMembershipCatalog';
import { useSendMembershipScheduleLink } from '../hooks/useSendMembershipScheduleLink';
import { useSubscriptionsAccess } from '../hooks/useSubscriptionsAccess';
import { membershipCatalogQueryKey } from '../queryKeys';
import { getCancelMembershipToastMessage } from '../utils/cancelMembershipCopy';
import { getScheduleLinkSentToastMessage } from '../utils/scheduleLinkSentCopy';
import { mapSubscriptionDetailModel } from '../utils/subscriptionPresentation';

export function SubscriptionDetailScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const navigation = useNavigation();
  const route = useRoute();
  const subscriptionId = String(route.params?.subscriptionId ?? '').trim() || undefined;
  const { subscriber, businessId, isPending, errorMessage, refetch } =
    useMembershipSubscriber(subscriptionId);
  const { featureEnabled } = useSubscriptionsAccess();
  const { sendScheduleLink, isSending } = useSendMembershipScheduleLink({ businessId });
  const { cancelMembership, isCanceling } = useCancelMembership({ businessId });
  const queryClient = useQueryClient();

  const model = useMemo(
    () => (subscriber ? mapSubscriptionDetailModel(subscriber) : null),
    [subscriber],
  );

  const [notes, setNotes] = useState('');
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    if (notesSaving) return;
    const next = String(model?.notes ?? '');
    setNotes(next);
    setNotesDraft(next);
    setNotesEditing(false);
  }, [model?.id, model?.notes, notesSaving]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Subscriber',
      headerRight: undefined,
    });
  }, [navigation]);

  const handleOpenVisit = useCallback(() => {
    const bookingId = String(model?.periodVisitBookingId ?? '').trim();
    if (!bookingId) return;
    navigateNestedTabScreen(navigation, {
      tab: ROUTES.BOOKINGS,
      screen: ROUTES.BOOKING_DETAILS,
      params: { bookingId },
    });
  }, [model?.periodVisitBookingId, navigation]);

  const handleBookVisit = useCallback(() => {
    if (!model?.needsVisit) return;
    navigation.navigate(ROUTES.CREATE_APPOINTMENT, {
      membershipId: model.id,
      customerId: model.customerId ?? '',
      initialBookingId: model.initialBookingId ?? '',
      customerName: model.customerName,
      customerEmail: model.customerEmail,
      customerPhone: model.customerPhone,
      notes: model.notes ?? '',
      planName: model.planName || model.serviceName,
      durationMinutes: model.visitDurationMinutes || 60,
    });
  }, [model, navigation]);

  const handleSendRebookLink = useCallback(async () => {
    if (!model?.needsVisit) return;
    if (!model.canSendRebookLink) {
      Alert.alert('Missing contact info', SUBSCRIPTION_REBOOK_NO_CONTACT);
      return;
    }
    try {
      const result = await sendScheduleLink(model.id);
      const message = getScheduleLinkSentToastMessage(result);
      if (result.smsed) {
        toast.sms(message);
      } else if (result.emailed) {
        toast.email(message);
      } else {
        toast.success(message);
      }
    } catch (error) {
      const status = Number(error?.httpStatus) || 0;
      if (status === 409) {
        void refetch();
      }
      toast.error(error?.message?.trim() || 'Could not send schedule link.');
    }
  }, [model?.canSendRebookLink, model?.id, model?.needsVisit, refetch, sendScheduleLink, toast]);

  const handleCancelMembership = useCallback(
    async (action) => {
      if (!model?.canCancel || isCanceling) return;
      try {
        const result = await cancelMembership({ subscriberId: model.id, action });
        toast.success(
          getCancelMembershipToastMessage({
            alreadyCanceled: result.alreadyCanceled,
            action,
          }),
        );
      } catch (error) {
        toast.error(
          error?.message?.trim() || 'Could not cancel this subscription. Try again in a moment.',
        );
      }
    },
    [cancelMembership, isCanceling, model?.canCancel, model?.id, toast],
  );

  const handleCancel = useCallback(() => {
    if (!model?.canCancel || isCanceling) return;
    Alert.alert(SUBSCRIPTION_CANCEL_ALERT_TITLE, SUBSCRIPTION_CANCEL_ALERT_MESSAGE, [
      { text: SUBSCRIPTION_CANCEL_KEEP, style: 'cancel' },
      {
        text: SUBSCRIPTION_CANCEL_PERIOD_END,
        onPress: () => {
          void handleCancelMembership(CANCEL_MEMBERSHIP_PERIOD_END);
        },
      },
      {
        text: SUBSCRIPTION_CANCEL_NOW,
        style: 'destructive',
        onPress: () => {
          void handleCancelMembership(CANCEL_MEMBERSHIP_NOW);
        },
      },
    ]);
  }, [handleCancelMembership, isCanceling, model?.canCancel]);

  const handleStartEditNotes = useCallback(() => {
    if (notesSaving || !model) return;
    setNotesDraft(notes);
    setNotesEditing(true);
  }, [model, notes, notesSaving]);

  const handleCancelEditNotes = useCallback(() => {
    if (notesSaving) return;
    setNotesDraft(notes);
    setNotesEditing(false);
  }, [notes, notesSaving]);

  const handleSaveNotes = useCallback(async () => {
    if (notesSaving || !model) return;
    if (!businessId) {
      Alert.alert('Unable to save notes', 'Missing business context. Please go back and retry.');
      return;
    }
    setNotesSaving(true);
    try {
      const { error } = await updateMembershipSubscriberNotes(businessId, model.id, notesDraft);
      if (error) {
        Alert.alert(
          'Unable to save notes',
          safeUserFacingMessage(error, { fallback: 'Please try again in a moment.' }),
        );
        return;
      }
      setNotes(String(notesDraft ?? '').trim());
      setNotesEditing(false);
      await queryClient.invalidateQueries({ queryKey: membershipCatalogQueryKey(businessId) });
    } finally {
      setNotesSaving(false);
    }
  }, [businessId, model, notesDraft, notesSaving, queryClient]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        scroll: {
          flex: 1,
        },
        content: {
          gap: 22,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 14,
        },
      }),
    [colors],
  );

  if (!featureEnabled) {
    return null;
  }

  if (!subscriptionId) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message={SUBSCRIPTION_DETAIL_NOT_FOUND} />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (isPending && !model) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <SubscriptionDetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!model) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message={errorMessage || SUBSCRIPTION_DETAIL_NOT_FOUND} />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SubscriptionDetailBody
          model={model}
          onBookVisit={handleBookVisit}
          onOpenVisit={handleOpenVisit}
          onSendScheduleLink={handleSendRebookLink}
          sendScheduleLinkLoading={isSending || isCanceling}
        />
        <SubscriberCustomerCard email={model.customerEmail} phone={model.customerPhone} />
        <CustomerNotesSection
          draftNotes={notesDraft}
          first
          isEditing={notesEditing}
          notes={notes}
          placeholder="Prefers weekdays in the morning, gate code…"
          saveLoading={notesSaving}
          onCancelEdit={handleCancelEditNotes}
          onChangeDraftNotes={setNotesDraft}
          onSaveEdit={handleSaveNotes}
          onStartEdit={handleStartEditNotes}
        />
        <SubscriptionDetailActions
          canCancel={model.canCancel}
          cancelLoading={isCanceling}
          cancelNote={model.canCancelImmediateNote}
          onCancel={handleCancel}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
