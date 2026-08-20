import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, FilterPills, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import { enableServicelinkPaymentsViaSupabase } from '../../payments/api/enableServicelinkPaymentsViaSupabase';
import { postStripeConnectOnboard } from '../../payments/api/postStripeConnectOnboard';
import { postStripeConnectSync } from '../../payments/api/postStripeConnectSync';
import { PaymentsStripeConnectSetupCard } from '../../payments/components/PaymentsStripeConnectSetupCard';
import { StripeConnectLaunchOverlay } from '../../payments/components/StripeConnectLaunchOverlay';
import { STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL } from '../../payments/constants/stripeConnectReturnUrl';
import { usePaymentDashboardRead } from '../../payments/hooks/usePaymentDashboardRead';
import {
  getStripeConnectSetupCopy,
  resolveStripeConnectSetupPresentation,
} from '../../payments/utils/stripeConnectSetupCopy';
import { useSubscription } from '../../subscription';
import { AddSubscriptionFab } from '../components/AddSubscriptionFab';
import { SubscriptionMemberCard } from '../components/SubscriptionMemberCard';
import { SubscriptionPlanCard } from '../components/SubscriptionPlanCard';
import { SubscriptionsCreatePlanSheet } from '../components/SubscriptionsCreatePlanSheet';
import { SubscriptionsEmptyLearning } from '../components/SubscriptionsEmptyLearning';
import { SubscriptionsEnablePaymentsGate } from '../components/SubscriptionsEnablePaymentsGate';
import { SubscriptionsHubSkeleton } from '../components/SubscriptionsHubSkeleton';
import { SubscriptionsHubTabs } from '../components/SubscriptionsHubTabs';
import { SubscriptionsNonProGate } from '../components/SubscriptionsNonProGate';
import {
  SUBSCRIPTIONS_HUB_PLANS,
  SUBSCRIPTIONS_LIST_EMPTY,
  SUBSCRIPTIONS_PLANS_EMPTY,
  SUBSCRIPTIONS_TAB_ACTIVE,
  SUBSCRIPTIONS_TAB_CANCELED,
} from '../constants';
import { SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP } from '../constants/setupCopy';
import { filterSubscribersByListTab, useMembershipCatalog } from '../hooks/useMembershipCatalog';
import { useMembershipPlanWrites } from '../hooks/useMembershipPlanWrites';
import { useSubscriptionsAccess } from '../hooks/useSubscriptionsAccess';
import { mapSubscriptionListCard } from '../utils/subscriptionPresentation';

const HOME_FAB_BOTTOM = 30;

export function SubscriptionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const { session } = useAuth();
  const {
    hasProAccess,
    isOwnerProfileLoaded,
    isLoading: subscriptionLoading,
    loadError: subscriptionLoadError,
    refetchSubscription,
  } = useSubscription();
  const payment = usePaymentDashboardRead();
  const catalog = useMembershipCatalog();
  const subscriptionsAccess = useSubscriptionsAccess();
  const { createPlan, isCreating } = useMembershipPlanWrites({
    businessId: catalog.businessId,
  });

  const [hubTab, setHubTab] = useState(SUBSCRIPTIONS_HUB_PLANS);
  const [listTab, setListTab] = useState(SUBSCRIPTIONS_TAB_ACTIVE);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [enablePaymentsLoading, setEnablePaymentsLoading] = useState(false);

  const plans = catalog.plans;
  const connectPresentation = useMemo(() => {
    const account = payment.paymentAccount;
    return resolveStripeConnectSetupPresentation(account, getStripeConnectSetupCopy(account));
  }, [payment.paymentAccount]);

  const requirementsMet =
    hasProAccess && payment.stripeConnectReady && payment.hasPaymentSettingsRow;

  const handleCreateSubmit = useCallback(
    async (draft) => {
      await createPlan(draft);
      setHubTab(SUBSCRIPTIONS_HUB_PLANS);
    },
    [createPlan],
  );

  const onStripeConnectPress = useCallback(async () => {
    const token = session?.access_token ?? null;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConnectSubmitting(true);
    try {
      const created = await postStripeConnectOnboard(token);
      if ('error' in created) {
        Alert.alert(
          'Could not open Stripe',
          safeUserFacingMessage(created.error, { fallback: 'Something went wrong. Try again.' }),
        );
        return;
      }
      const authResult = await WebBrowser.openAuthSessionAsync(
        created.url,
        STRIPE_CONNECT_ONBOARDING_AUTH_RETURN_URL,
      );
      if (authResult?.type === 'success') {
        await postStripeConnectSync(token).catch(() => {});
        await payment.refetchPayments();
        await refetchSubscription();
      }
    } catch (e) {
      Alert.alert(
        'Stripe',
        safeUserFacingMessage(e, { fallback: 'Something went wrong. Try again.' }),
      );
    } finally {
      setConnectSubmitting(false);
    }
  }, [payment, refetchSubscription, session?.access_token]);

  const onServicelinkEnablePress = useCallback(async () => {
    const bid = payment.business?.id ?? null;
    const paymentAccountId = payment.paymentAccount?.id ?? null;
    if (!bid || !paymentAccountId) {
      Alert.alert(
        'Turn on payments',
        'Your business or Stripe account is not ready yet. Try again in a moment.',
      );
      return;
    }
    setEnablePaymentsLoading(true);
    try {
      const out = await enableServicelinkPaymentsViaSupabase({
        businessId: bid,
        paymentAccountId,
      });
      if ('error' in out) {
        Alert.alert(
          'Turn on payments',
          safeUserFacingMessage(out.error, {
            fallback: 'Could not turn on payments. Try again.',
          }),
        );
        return;
      }
      await payment.refetchPayments();
      await refetchSubscription();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      Alert.alert(
        'Turn on payments',
        safeUserFacingMessage(e, { fallback: 'Something went wrong. Try again.' }),
      );
    } finally {
      setEnablePaymentsLoading(false);
    }
  }, [payment, refetchSubscription]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        body: {
          flex: 1,
          position: 'relative',
        },
        scroll: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
          paddingBottom: 28 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        setupBlock: {
          gap: 14,
        },
        loadingWrap: {
          alignSelf: 'stretch',
        },
        retryWrap: {
          marginTop: 12,
        },
        statusPills: {
          marginBottom: 12,
          marginTop: 4,
        },
        list: {
          gap: 12,
        },
        plansHeader: {
          marginBottom: 12,
        },
        plansHeaderTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        emptyWrap: {
          alignItems: 'center',
          marginTop: 8,
          paddingHorizontal: 8,
        },
        emptyCentered: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 40,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
          marginTop: 8,
          textAlign: 'center',
        },
      }),
    [colors, tabBarHeight],
  );

  const showLoading =
    Boolean(subscriptionLoading) ||
    !isOwnerProfileLoaded ||
    (hasProAccess && (payment.isPendingBusiness || payment.isPendingPayments)) ||
    (requirementsMet && catalog.isPending);

  const loadError =
    subscriptionLoadError ||
    (hasProAccess ? payment.businessError || payment.paymentLoadError : null) ||
    (requirementsMet ? catalog.errorMessage : null);

  const showNonPro = !showLoading && !loadError && isOwnerProfileLoaded && !hasProAccess;
  const showNeedsConnect =
    !showLoading && !loadError && hasProAccess && !payment.stripeConnectReady;
  const showPaymentsOff =
    !showLoading &&
    !loadError &&
    hasProAccess &&
    payment.stripeConnectReady &&
    payment.gateServicelinkCheckout;
  const showReady = !showLoading && !loadError && requirementsMet;
  const showEmptyLearning = showReady && plans.length === 0;
  const showLiveHub = showReady && plans.length > 0;

  const hubMembers = useMemo(() => {
    return filterSubscribersByListTab(catalog.subscribers, listTab).map(mapSubscriptionListCard);
  }, [catalog.subscribers, listTab]);

  const subscribersNeedVisit = useMemo(
    () =>
      catalog.subscribers.some(
        (row) => row.isActiveList && String(row.visitStatus ?? '').trim() === 'needs_visit',
      ),
    [catalog.subscribers],
  );

  const subscribersTabOptions = useMemo(() => {
    const activeCount = catalog.subscribers.filter((row) => row.isActiveList).length;
    const canceledCount = catalog.subscribers.filter((row) => row.isCanceledList).length;
    return [
      { key: SUBSCRIPTIONS_TAB_ACTIVE, label: `Active (${activeCount})` },
      { key: SUBSCRIPTIONS_TAB_CANCELED, label: `Canceled (${canceledCount})` },
    ];
  }, [catalog.subscribers]);

  const membersEmpty = SUBSCRIPTIONS_LIST_EMPTY[listTab] ?? SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP;

  const handleRetry = useCallback(() => {
    void refetchSubscription();
    void payment.refetchPayments();
    void catalog.refetch();
  }, [catalog, payment, refetchSubscription]);

  if (!subscriptionsAccess.featureEnabled) {
    return null;
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {showLoading ? (
            <View style={styles.loadingWrap}>
              <SubscriptionsHubSkeleton />
            </View>
          ) : null}

          {!showLoading && loadError ? (
            <SurfaceCard padding="md">
              <InlineCardError message={loadError} />
              <View style={styles.retryWrap}>
                <Button fullWidth title="Try again" variant="secondary" onPress={handleRetry} />
              </View>
            </SurfaceCard>
          ) : null}

          {showNonPro ? (
            <View style={styles.setupBlock}>
              <SubscriptionsNonProGate />
            </View>
          ) : null}

          {showNeedsConnect ? (
            <View style={styles.setupBlock}>
              <PaymentsStripeConnectSetupCard
                buttonTitle={connectPresentation.buttonTitle}
                description={connectPresentation.description}
                loading={connectSubmitting}
                title={connectPresentation.title}
                onConnectPress={() => {
                  void onStripeConnectPress();
                }}
              />
            </View>
          ) : null}

          {showPaymentsOff ? (
            <View style={styles.setupBlock}>
              <SubscriptionsEnablePaymentsGate
                loading={enablePaymentsLoading}
                onEnablePress={() => {
                  void onServicelinkEnablePress();
                }}
              />
            </View>
          ) : null}

          {showEmptyLearning ? <SubscriptionsEmptyLearning /> : null}

          {showLiveHub ? (
            <>
              <SubscriptionsHubTabs
                subscribersAttention={subscribersNeedVisit}
                value={hubTab}
                onChange={setHubTab}
              />

              {hubTab === SUBSCRIPTIONS_HUB_PLANS ? (
                <>
                  <View style={styles.plansHeader}>
                    <AppText style={styles.plansHeaderTitle}>Your subscriptions</AppText>
                  </View>

                  {plans.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <AppText style={styles.emptyTitle}>{SUBSCRIPTIONS_PLANS_EMPTY.title}</AppText>
                      <AppText style={styles.emptyBody}>{SUBSCRIPTIONS_PLANS_EMPTY.body}</AppText>
                    </View>
                  ) : (
                    <View style={styles.list}>
                      {plans.map((plan) => (
                        <SubscriptionPlanCard
                          key={plan.id}
                          plan={plan}
                          onPress={() =>
                            navigation.navigate(ROUTES.SUBSCRIPTION_PLAN_DETAIL, {
                              planId: plan.id,
                              plan,
                            })
                          }
                        />
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.statusPills}>
                    <FilterPills
                      onSelect={setListTab}
                      options={subscribersTabOptions}
                      selectedKey={listTab}
                    />
                  </View>

                  {hubMembers.length === 0 ? (
                    <View style={styles.emptyCentered}>
                      <AppText style={styles.emptyTitle}>{membersEmpty.title}</AppText>
                      <AppText style={styles.emptyBody}>{membersEmpty.body}</AppText>
                    </View>
                  ) : (
                    <View style={styles.list}>
                      {hubMembers.map((card) => (
                        <SubscriptionMemberCard
                          key={card.id}
                          cadenceLabel={card.cadenceLabel}
                          customerName={card.customerName}
                          planName={card.planName}
                          statusLabel={card.statusLabel}
                          statusRaw={card.statusRaw}
                          onPress={() =>
                            navigation.navigate(ROUTES.SUBSCRIPTION_DETAIL, {
                              subscriptionId: card.id,
                            })
                          }
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </>
          ) : null}
        </ScrollView>

        {showEmptyLearning || (showLiveHub && hubTab === SUBSCRIPTIONS_HUB_PLANS) ? (
          <AddSubscriptionFab bottom={HOME_FAB_BOTTOM} onPress={() => setCreateSheetOpen(true)} />
        ) : null}

        <SubscriptionsCreatePlanSheet
          submitting={isCreating}
          visible={createSheetOpen}
          onRequestClose={() => {
            if (isCreating) return;
            setCreateSheetOpen(false);
          }}
          onSubmit={handleCreateSubmit}
        />

        <StripeConnectLaunchOverlay visible={connectSubmitting} />
      </View>
    </SafeAreaView>
  );
}
