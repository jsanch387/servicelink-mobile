import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Button, InfoSection, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { deleteMaintenanceEnrollmentForBusiness } from '../api/deleteMaintenanceEnrollmentForBusiness';
import { mapMaintenanceDeleteError } from '../api/mapMaintenanceDeleteError';
import { MaintenanceDetailBody } from '../components/MaintenanceDetailBody';
import { MaintenanceDetailSkeleton } from '../components/MaintenanceDetailSkeleton';
import { MaintenanceDetailDangerSection } from '../components/MaintenanceDetailDangerSection';
import { MaintenanceDetailLinkSection } from '../components/MaintenanceDetailLinkSection';
import { MaintenancePaymentSection } from '../components/MaintenancePaymentSection';
import {
  MAINTENANCE_DETAIL_DELETE_ALERT_MESSAGE,
  MAINTENANCE_DETAIL_DELETE_ALERT_TITLE,
  MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE,
} from '../constants';
import { useMaintenanceDetail } from '../hooks/useMaintenanceDetail';
import { maintenanceDetailQueryKey, MAINTENANCE_QUERY_ROOT } from '../queryKeys';
import { CUSTOMERS_QUERY_ROOT } from '../../customers/queryKeys';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';

export function MaintenanceDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const customerId = String(route.params?.customerId ?? '').trim() || undefined;
  const enrollmentId = String(route.params?.enrollmentId ?? '').trim() || undefined;
  const [linkCopyFeedback, setLinkCopyFeedback] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const {
    businessId,
    model,
    isLoading,
    detailError,
    businessError,
    notFound,
    refetch,
    isFetching,
  } = useMaintenanceDetail(customerId, enrollmentId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: model?.customerName ? model.customerName : 'Maintenance detail',
    });
  }, [model?.customerName, navigation]);

  const handleBackToList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_ROOT });
    navigation.goBack();
  }, [navigation, queryClient]);

  const handleViewCustomer = useCallback(() => {
    if (!customerId) return;
    navigation.navigate(ROUTES.CUSTOMER_DETAILS, { customerId });
  }, [customerId, navigation]);

  const handleConfirmRemoveMaintenance = useCallback(async () => {
    if (removeLoading || !businessId || !customerId || !enrollmentId) {
      return;
    }
    setRemoveLoading(true);
    try {
      const { deleted, error } = await deleteMaintenanceEnrollmentForBusiness(
        businessId,
        customerId,
        enrollmentId,
      );
      if (error || !deleted) {
        Alert.alert(
          'Could not remove',
          safeUserFacingMessage(error, {
            fallback: mapMaintenanceDeleteError(error),
          }),
        );
        return;
      }

      const detailKey = maintenanceDetailQueryKey(businessId, customerId, enrollmentId);
      await queryClient.cancelQueries({ queryKey: detailKey });
      queryClient.removeQueries({ queryKey: detailKey });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_ROOT }),
      ]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      handleBackToList();
    } finally {
      setRemoveLoading(false);
    }
  }, [businessId, customerId, enrollmentId, handleBackToList, queryClient, removeLoading]);

  const handleRemoveMaintenance = useCallback(() => {
    if (removeLoading || !model?.canDelete) {
      return;
    }
    Alert.alert(MAINTENANCE_DETAIL_DELETE_ALERT_TITLE, MAINTENANCE_DETAIL_DELETE_ALERT_MESSAGE, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void handleConfirmRemoveMaintenance();
        },
      },
    ]);
  }, [handleConfirmRemoveMaintenance, model?.canDelete, removeLoading]);

  const handleCopyInviteLink = useCallback(async () => {
    const link = String(model?.inviteLink ?? '').trim();
    if (!link) return;
    await Clipboard.setStringAsync(link);
    void Haptics.selectionAsync().catch(() => {});
    setLinkCopyFeedback(true);
    setTimeout(() => setLinkCopyFeedback(false), 2000);
  }, [model?.inviteLink]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void refetch()}
        refreshing={Boolean(isFetching && !isLoading)}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isFetching, isLoading, refetch],
  );

  const customerRows = useMemo(() => {
    if (!model) return [];
    const rows = [
      {
        key: 'name',
        icon: 'person-outline',
        value: model.customerName,
        emphasize: true,
        onPress: handleViewCustomer,
        accessibilityLabel: `View ${model.customerName} profile`,
        trailing: <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />,
      },
    ];
    const email = String(model.customerEmail ?? '').trim();
    if (email) {
      rows.push({
        key: 'email',
        icon: 'mail-outline',
        value: email,
        interactionStyle: 'none',
      });
    }
    return rows;
  }, [colors.textMuted, handleViewCustomer, model]);

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
          paddingTop: 16,
        },
        errorRetry: {
          marginTop: 12,
        },
        errorFooter: {
          gap: 14,
          marginTop: 8,
        },
      }),
    [colors],
  );

  if (!customerId || !enrollmentId) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message="We could not load this maintenance offer. Go back and try again." />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (businessError) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 20 }]}
          refreshControl={refreshControl}
          style={styles.scroll}
        >
          <SurfaceCard padding="md">
            <InlineCardError message={businessError} />
            <Button
              fullWidth
              loading={Boolean(isFetching && !isLoading)}
              style={styles.errorRetry}
              title="Try again"
              variant="secondary"
              onPress={() => void refetch()}
            />
          </SurfaceCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading && !model) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <MaintenanceDetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (detailError || notFound || !model) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: 20 }]}
          refreshControl={refreshControl}
          style={styles.scroll}
        >
          <SurfaceCard padding="md">
            <InlineCardError message={detailError ?? MAINTENANCE_DETAIL_NOT_FOUND_USER_MESSAGE} />
            <Button
              fullWidth
              loading={Boolean(isFetching && !isLoading)}
              style={styles.errorRetry}
              title="Try again"
              variant="secondary"
              onPress={() => void refetch()}
            />
          </SurfaceCard>
          <View style={styles.errorFooter}>
            <Button
              fullWidth
              title="Back to maintenance"
              variant="secondary"
              onPress={handleBackToList}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <MaintenanceDetailBody model={model} />
        {model.payment?.visible ? <MaintenancePaymentSection payment={model.payment} /> : null}
        <InfoSection rowGap={14} rows={customerRows} title="Customer" />
        <MaintenanceDetailLinkSection
          canCopyLink={model.canCopyLink}
          linkCopied={linkCopyFeedback}
          onCopyLink={() => void handleCopyInviteLink()}
        />

        {model.canDelete ? (
          <MaintenanceDetailDangerSection
            removeLoading={removeLoading}
            onRemove={handleRemoveMaintenance}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
