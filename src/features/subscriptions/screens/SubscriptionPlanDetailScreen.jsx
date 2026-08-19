import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InlineCardError, SurfaceCard, useToast } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { MEMBERSHIP_PLAN_DELETE_HAS_SUBSCRIBERS } from '../api/membershipPlanWrites';
import { PlanDetailBody } from '../components/PlanDetailBody';
import { SubscriptionPlanDetailSkeleton } from '../components/SubscriptionPlanDetailSkeleton';
import { SubscriptionsCreatePlanSheet } from '../components/SubscriptionsCreatePlanSheet';
import {
  SUBSCRIPTION_DELETE_ALERT_MESSAGE,
  SUBSCRIPTION_DELETE_ALERT_TITLE,
  SUBSCRIPTION_DELETE_BLOCKED_MESSAGE,
  SUBSCRIPTION_DELETE_BLOCKED_TITLE,
  SUBSCRIPTION_DELETE_CONFIRM,
  SUBSCRIPTION_DELETE_SUCCESS,
  SUBSCRIPTION_SAVE_SUCCESS,
  SUBSCRIPTIONS_TAB_CANCELED,
} from '../constants';
import { useMembershipPlan } from '../hooks/useMembershipCatalog';
import { useMembershipPlanWrites } from '../hooks/useMembershipPlanWrites';
import { useSubscriptionsAccess } from '../hooks/useSubscriptionsAccess';

/**
 * Owner plan detail — read view + edit/delete via web membership plan API.
 */
export function SubscriptionPlanDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const toast = useToast();
  const { featureEnabled } = useSubscriptionsAccess();
  const routePlan = route.params?.plan ?? null;
  const planId = String(route.params?.planId ?? routePlan?.id ?? '').trim();
  const {
    plan: livePlan,
    planSubscribers,
    businessId,
    isPending,
    errorMessage,
  } = useMembershipPlan(planId);
  const plan = livePlan ?? routePlan;
  const [editOpen, setEditOpen] = useState(false);
  const { updatePlan, deletePlan, isUpdating, isDeleting } = useMembershipPlanWrites({
    businessId,
  });

  const activeSubscriberCount = useMemo(
    () => planSubscribers.filter((row) => row.isActiveList).length,
    [planSubscribers],
  );
  const canceledSubscriberCount = useMemo(
    () => planSubscribers.filter((row) => row.isCanceledList).length,
    [planSubscribers],
  );

  const handleOpenEdit = useCallback(() => {
    setEditOpen(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    if (isUpdating) return;
    setEditOpen(false);
  }, [isUpdating]);

  const handleSaveEdit = useCallback(
    async (draft) => {
      try {
        await updatePlan({ planId, draft });
        toast.success(SUBSCRIPTION_SAVE_SUCCESS);
        setEditOpen(false);
      } catch (e) {
        toast.error(safeUserFacingMessage(e, { fallback: 'Could not save. Try again.' }));
      }
    },
    [planId, toast, updatePlan],
  );

  const runDelete = useCallback(async () => {
    try {
      await deletePlan(planId);
      toast.success(SUBSCRIPTION_DELETE_SUCCESS);
      navigation.goBack();
    } catch (e) {
      if (e?.code === MEMBERSHIP_PLAN_DELETE_HAS_SUBSCRIBERS || e?.httpStatus === 409) {
        Alert.alert(
          SUBSCRIPTION_DELETE_BLOCKED_TITLE,
          e?.message || SUBSCRIPTION_DELETE_BLOCKED_MESSAGE,
        );
        return;
      }
      toast.error(safeUserFacingMessage(e, { fallback: 'Could not delete. Try again.' }));
    }
  }, [deletePlan, navigation, planId, toast]);

  const handleDelete = useCallback(() => {
    if (isDeleting) return;
    if (activeSubscriberCount > 0) {
      Alert.alert(SUBSCRIPTION_DELETE_BLOCKED_TITLE, SUBSCRIPTION_DELETE_BLOCKED_MESSAGE);
      return;
    }
    Alert.alert(SUBSCRIPTION_DELETE_ALERT_TITLE, SUBSCRIPTION_DELETE_ALERT_MESSAGE, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: SUBSCRIPTION_DELETE_CONFIRM,
        style: 'destructive',
        onPress: () => {
          void runDelete();
        },
      },
    ]);
  }, [activeSubscriberCount, isDeleting, runDelete]);

  const handleOpenSubscribers = useCallback(() => {
    if (!plan?.id) return;
    navigation.navigate(ROUTES.SUBSCRIPTION_PLAN_SUBSCRIBERS, {
      planId: plan.id,
      plan,
      ...(activeSubscriberCount === 0 && canceledSubscriberCount > 0
        ? { initialListTab: SUBSCRIPTIONS_TAB_CANCELED }
        : null),
    });
  }, [activeSubscriberCount, canceledSubscriberCount, navigation, plan]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Subscription details',
      headerLeft: undefined,
      headerRight: undefined,
    });
  }, [navigation]);

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
          flexGrow: 1,
          paddingBottom: 12,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 14,
        },
        loadingWrap: {
          paddingTop: 0,
        },
      }),
    [colors],
  );

  if (!featureEnabled) {
    return null;
  }

  if (!planId) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message="We could not open this subscription. Go back and try again." />
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (isPending && !plan) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, styles.loadingWrap]}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <SubscriptionPlanDetailSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!plan?.id) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError
              message={
                errorMessage || 'We could not open this subscription. Go back and try again.'
              }
            />
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
        <PlanDetailBody
          activeSubscriberCount={activeSubscriberCount}
          canceledSubscriberCount={canceledSubscriberCount}
          deleting={isDeleting}
          plan={plan}
          onDelete={handleDelete}
          onEdit={handleOpenEdit}
          onOpenSubscribers={handleOpenSubscribers}
        />
      </ScrollView>

      <SubscriptionsCreatePlanSheet
        initialPlan={plan}
        mode="edit"
        submitting={isUpdating}
        visible={editOpen}
        onRequestClose={handleCloseEdit}
        onSubmit={handleSaveEdit}
      />
    </SafeAreaView>
  );
}
