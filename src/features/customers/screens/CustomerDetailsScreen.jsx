import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { AppText, Button, InlineCardError, SkeletonBox, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { CustomerDetailActionsSection } from '../customer-details/components/CustomerDetailActionsSection';
import { CustomerNotesSection } from '../customer-details/components/CustomerNotesSection';
import { CustomerProfileContactCard } from '../customer-details/components/CustomerProfileContactCard';
import { CustomerStatsSection } from '../customer-details/components/CustomerStatsSection';
import { removeCustomerForBusiness, updateCustomerNotesForBusiness } from '../api/customers';
import { openCustomerCheckInSms } from '../customer-details/utils/openCustomerCheckInSms';
import { useCustomerDetails } from '../hooks/useCustomerDetails';
import { CUSTOMERS_QUERY_ROOT, customerDetailsQueryKey } from '../queryKeys';

function CustomerDetailsSkeleton() {
  return (
    <View style={skeletonStyles.column}>
      <SurfaceCard style={skeletonStyles.profileCard}>
        <SkeletonBox borderRadius={24} height={48} width={48} />
        <SkeletonBox borderRadius={8} height={22} style={{ marginTop: 12 }} width="55%" />
        <SkeletonBox borderRadius={8} height={16} style={{ marginTop: 16 }} width="72%" />
        <SkeletonBox borderRadius={8} height={16} style={{ marginTop: 10 }} width="66%" />
      </SurfaceCard>

      <View style={skeletonStyles.section}>
        <SkeletonBox borderRadius={8} height={18} width="26%" />
        <View style={skeletonStyles.statsRow}>
          {[0, 1, 2].map((k) => (
            <SurfaceCard key={k} style={skeletonStyles.statCard}>
              <SkeletonBox borderRadius={8} height={14} style={{ marginTop: 4 }} width="60%" />
              <SkeletonBox borderRadius={8} height={20} style={{ marginTop: 10 }} width="70%" />
              {k === 2 ? (
                <SkeletonBox borderRadius={8} height={12} style={{ marginTop: 6 }} width="45%" />
              ) : null}
            </SurfaceCard>
          ))}
        </View>
      </View>

      <View style={skeletonStyles.section}>
        <SkeletonBox borderRadius={8} height={18} width="23%" />
        <SurfaceCard style={skeletonStyles.notesCard}>
          <SkeletonBox borderRadius={8} height={16} width="85%" />
          <SkeletonBox borderRadius={8} height={16} style={{ marginTop: 10 }} width="92%" />
          <SkeletonBox borderRadius={8} height={16} style={{ marginTop: 10 }} width="76%" />
        </SurfaceCard>
      </View>

      <View style={skeletonStyles.actions}>
        <SkeletonBox borderRadius={14} height={52} width="100%" />
        <SkeletonBox borderRadius={14} height={52} style={{ marginTop: 10 }} width="100%" />
      </View>
    </View>
  );
}

export function CustomerDetailsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const route = useRoute();
  const customerId = route.params?.customerId;
  const [removeLoading, setRemoveLoading] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const {
    businessId,
    businessError,
    customerId: detailCustomerId,
    detailError,
    invalidId,
    isLoading,
    model,
    notFound,
  } = useCustomerDetails(customerId);

  const customerPhoneDigits = useMemo(
    () => String(model?.phone ?? '').replace(/\D/g, ''),
    [model?.phone],
  );
  const hasCallablePhone = customerPhoneDigits.length >= 10;
  const notesText = typeof model?.ownerNotes === 'string' ? model.ownerNotes : '';

  const handleCallCustomer = useCallback(async () => {
    if (!hasCallablePhone) {
      Alert.alert(
        'No phone number',
        'A valid phone number is not available for this customer yet.',
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

  const handleEmailCustomer = useCallback(async () => {
    const email = typeof model?.email === 'string' ? model.email.trim() : '';
    if (!email) {
      Alert.alert('No email', 'An email address is not available for this customer yet.');
      return;
    }
    const url = `mailto:${encodeURIComponent(email)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Unable to open mail', 'No mail app is available on this device.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open mail', 'Something went wrong opening your mail app.');
    }
  }, [model?.email]);

  const handleSendText = useCallback(async () => {
    if (!model) {
      return;
    }
    await openCustomerCheckInSms({ phone: model.phone });
  }, [model]);

  const handleConfirmRemoveCustomer = useCallback(async () => {
    if (removeLoading) {
      return;
    }
    if (!businessId || !detailCustomerId) {
      Alert.alert(
        'Unable to remove customer',
        'Missing customer context. Please go back and retry.',
      );
      return;
    }

    setRemoveLoading(true);
    try {
      const { error } = await removeCustomerForBusiness(businessId, detailCustomerId);
      if (error) {
        Alert.alert(
          'Unable to remove customer',
          safeUserFacingMessage(error, { fallback: 'Please try again in a moment.' }),
        );
        return;
      }

      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_ROOT });
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } finally {
      setRemoveLoading(false);
    }
  }, [businessId, detailCustomerId, navigation, queryClient, removeLoading]);

  const handleRemoveCustomer = useCallback(() => {
    if (removeLoading) {
      return;
    }
    Alert.alert('Remove this customer?', 'This permanently removes them from your customer list.', [
      { text: 'Keep customer', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void handleConfirmRemoveCustomer();
        },
      },
    ]);
  }, [handleConfirmRemoveCustomer, removeLoading]);

  const handleStartEditNotes = useCallback(() => {
    if (notesSaving || !model) {
      return;
    }
    setNotesDraft(notesText);
    setNotesEditing(true);
  }, [model, notesSaving, notesText]);

  const handleCancelEditNotes = useCallback(() => {
    if (notesSaving) {
      return;
    }
    setNotesEditing(false);
    setNotesDraft(notesText);
  }, [notesSaving, notesText]);

  const handleSaveNotes = useCallback(async () => {
    if (notesSaving) {
      return;
    }
    if (!businessId || !detailCustomerId) {
      Alert.alert('Unable to save notes', 'Missing customer context. Please go back and retry.');
      return;
    }

    setNotesSaving(true);
    try {
      const { error } = await updateCustomerNotesForBusiness(
        businessId,
        detailCustomerId,
        notesDraft,
      );
      if (error) {
        Alert.alert(
          'Unable to save notes',
          safeUserFacingMessage(error, { fallback: 'Please try again in a moment.' }),
        );
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: customerDetailsQueryKey(businessId, detailCustomerId),
      });
      await queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_ROOT });
      setNotesEditing(false);
    } finally {
      setNotesSaving(false);
    }
  }, [businessId, detailCustomerId, notesDraft, notesSaving, queryClient]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        content: {
          paddingBottom: 40,
          paddingHorizontal: 16,
          paddingTop: 10,
          rowGap: 16,
        },
        actionsBlock: {
          marginTop: 4,
        },
        centered: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          rowGap: 16,
        },
        fallbackText: {
          color: colors.textSecondary,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
        },
        errorBlock: {
          paddingHorizontal: 16,
          paddingTop: 16,
        },
      }),
    [colors],
  );

  if (invalidId || notFound) {
    const message = invalidId
      ? 'This screen needs a valid customer. Open the customer from your list.'
      : 'We could not find this customer for your business. They may have been removed.';
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <View style={styles.centered}>
          <AppText style={styles.fallbackText}>{message}</AppText>
          <Button onPress={() => navigation.goBack()} title="Go back" variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  if (businessError) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <View style={styles.errorBlock}>
          <SurfaceCard>
            <InlineCardError message={businessError} />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (detailError) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <View style={styles.errorBlock}>
          <SurfaceCard>
            <InlineCardError message={detailError} />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading || !model) {
    return (
      <SafeAreaView edges={['left', 'right']} style={styles.root}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <CustomerDetailsSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CustomerProfileContactCard
          email={model.email}
          fullName={model.fullName}
          hasCallablePhone={hasCallablePhone}
          onCall={handleCallCustomer}
          onEmail={handleEmailCustomer}
          phone={model.phone}
          segment={model.segment}
        />

        <CustomerStatsSection
          lastVisitAtIso={model.lastVisitAtIso}
          lastVisitLabel={model.lastVisitLabel}
          lastVisitRelativeLabel={model.lastVisitRelativeLabel}
          totalSpendLabel={model.totalSpendLabel}
          totalVisitsLabel={model.totalVisitsLabel}
        />

        <CustomerNotesSection
          draftNotes={notesDraft}
          isEditing={notesEditing}
          notes={notesText}
          onCancelEdit={handleCancelEditNotes}
          onChangeDraftNotes={setNotesDraft}
          onSaveEdit={handleSaveNotes}
          onStartEdit={handleStartEditNotes}
          saveLoading={notesSaving}
        />

        <View style={styles.actionsBlock}>
          <CustomerDetailActionsSection
            onRemoveCustomer={handleRemoveCustomer}
            onSendText={handleSendText}
            removeLoading={removeLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const skeletonStyles = StyleSheet.create({
  column: {
    rowGap: 16,
  },
  profileCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    rowGap: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    aspectRatio: 1.28,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  notesCard: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actions: {
    marginTop: 4,
  },
});
