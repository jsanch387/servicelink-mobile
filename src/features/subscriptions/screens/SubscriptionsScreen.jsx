import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
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
import { SubscriptionMemberCard } from '../components/SubscriptionMemberCard';
import { SubscriptionPlanCard } from '../components/SubscriptionPlanCard';
import { SubscriptionsCreateFirstGuide } from '../components/SubscriptionsCreateFirstGuide';
import { SubscriptionsCreatePlanSheet } from '../components/SubscriptionsCreatePlanSheet';
import { SubscriptionsEnablePaymentsGate } from '../components/SubscriptionsEnablePaymentsGate';
import { SubscriptionsHubTabs } from '../components/SubscriptionsHubTabs';
import { SubscriptionsNonProGate } from '../components/SubscriptionsNonProGate';
import { SubscriptionsSetupCompleteCard } from '../components/SubscriptionsSetupCompleteCard';
import {
  SUBSCRIPTIONS_HUB_PLANS,
  SUBSCRIPTIONS_LIST_EMPTY,
  SUBSCRIPTIONS_PLANS_EMPTY,
  SUBSCRIPTIONS_TAB_ACTIVE,
  SUBSCRIPTIONS_TAB_OPTIONS,
} from '../constants';
import { SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP } from '../constants/setupCopy';
import { lowestSchedulePriceCents, sortSchedules } from '../constants/planCadence';
import {
  getMockHubPlans,
  MOCK_SUBSCRIPTIONS,
  SEED_SUBSCRIPTIONS_HUB_FOR_DESIGN,
} from '../mock/mockSubscriptions';
import { mapSubscriptionListCard } from '../utils/subscriptionPresentation';

/** @typedef {'setup' | 'complete' | 'live'} SetupPhase */

const USE_DESIGN_HUB_SEED = __DEV__ && SEED_SUBSCRIPTIONS_HUB_FOR_DESIGN;

/**
 * Gates on live Pro / Stripe Connect / payments data, then create-first → hub.
 * Plans & members stay local until the memberships API is wired.
 */
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

  const [phase, setPhase] = useState(
    /** @type {SetupPhase} */ (USE_DESIGN_HUB_SEED ? 'live' : 'setup'),
  );
  const [plans, setPlans] = useState(
    /** @type {Array<import('../mock/mockSubscriptions').MockSubscriptionPlan & { offeredCadenceKeys?: string[]; cadenceKey?: string }>} */ (
      USE_DESIGN_HUB_SEED ? getMockHubPlans() : []
    ),
  );
  const [latestPlan, setLatestPlan] = useState(
    /** @type {(import('../mock/mockSubscriptions').MockSubscriptionPlan & { offeredCadenceKeys?: string[]; cadenceKey?: string }) | null} */ (
      null
    ),
  );
  const [hubTab, setHubTab] = useState(SUBSCRIPTIONS_HUB_PLANS);
  const [listTab, setListTab] = useState(SUBSCRIPTIONS_TAB_ACTIVE);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [enablePaymentsLoading, setEnablePaymentsLoading] = useState(false);

  const connectPresentation = useMemo(() => {
    const account = payment.paymentAccount;
    return resolveStripeConnectSetupPresentation(account, getStripeConnectSetupCopy(account));
  }, [payment.paymentAccount]);

  const requirementsMet =
    hasProAccess && payment.stripeConnectReady && payment.hasPaymentSettingsRow;

  const handleSavePlan = useCallback(
    async (draft) => {
      setSavingPlan(true);
      try {
        await new Promise((r) => setTimeout(r, 350));
        const offeredSchedules = sortSchedules(draft.offeredSchedules);
        const plan = {
          id: `plan_${Date.now()}`,
          name: draft.name,
          description: String(draft.description ?? '').trim(),
          serviceName: draft.serviceName,
          offeredSchedules,
          priceCents: lowestSchedulePriceCents(offeredSchedules) ?? 0,
          interval: /** @type {'month'} */ ('month'),
          offeredCadenceKeys: offeredSchedules.map((row) => row.cadenceKey),
          visitsPerPeriod: 1,
          isPublic: true,
        };
        const isFirstPlan = plans.length === 0;
        setPlans((prev) => [...prev, plan]);
        setLatestPlan(plan);
        setCreateSheetOpen(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        if (isFirstPlan) {
          setPhase('complete');
        } else {
          setPhase('live');
          setHubTab(SUBSCRIPTIONS_HUB_PLANS);
        }
      } finally {
        setSavingPlan(false);
      }
    },
    [plans.length],
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
        scroll: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
          paddingBottom: 28 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        contentComplete: {
          justifyContent: 'center',
        },
        setupBlock: {
          gap: 14,
        },
        completeBlock: {
          flexGrow: 1,
          justifyContent: 'center',
          width: '100%',
        },
        loadingWrap: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingVertical: 48,
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
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        plansHeaderTitle: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        addPlanLabel: {
          color: colors.accent,
          flexShrink: 0,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: -0.1,
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
    !USE_DESIGN_HUB_SEED &&
    (Boolean(subscriptionLoading) ||
      !isOwnerProfileLoaded ||
      (hasProAccess && (payment.isPendingBusiness || payment.isPendingPayments)));

  const loadError =
    subscriptionLoadError ||
    (hasProAccess ? payment.businessError || payment.paymentLoadError : null);

  const showNonPro =
    !USE_DESIGN_HUB_SEED && !showLoading && !loadError && isOwnerProfileLoaded && !hasProAccess;
  const showNeedsConnect =
    !USE_DESIGN_HUB_SEED &&
    !showLoading &&
    !loadError &&
    hasProAccess &&
    !payment.stripeConnectReady;
  const showPaymentsOff =
    !USE_DESIGN_HUB_SEED &&
    !showLoading &&
    !loadError &&
    hasProAccess &&
    payment.stripeConnectReady &&
    payment.gateServicelinkCheckout;
  const showReady = USE_DESIGN_HUB_SEED || (!showLoading && !loadError && requirementsMet);
  const showComplete = !USE_DESIGN_HUB_SEED && showReady && phase === 'complete' && latestPlan;
  const showCreateFirst =
    !USE_DESIGN_HUB_SEED && showReady && !showComplete && plans.length === 0 && phase !== 'live';
  const showLiveHub =
    USE_DESIGN_HUB_SEED || (showReady && !showComplete && (phase === 'live' || plans.length > 0));

  const hubMembers = useMemo(() => {
    return MOCK_SUBSCRIPTIONS.map(mapSubscriptionListCard).filter((card) => {
      if (listTab === SUBSCRIPTIONS_TAB_ACTIVE) {
        return card.statusRaw === 'active';
      }
      return card.statusRaw === listTab;
    });
  }, [listTab]);

  const membersEmpty = SUBSCRIPTIONS_LIST_EMPTY[listTab] ?? SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, showComplete ? styles.contentComplete : null]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {showLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : null}

        {!showLoading && loadError ? (
          <SurfaceCard padding="md">
            <InlineCardError message={loadError} />
            <View style={styles.retryWrap}>
              <Button
                fullWidth
                title="Try again"
                variant="secondary"
                onPress={() => {
                  void refetchSubscription();
                  void payment.refetchPayments();
                }}
              />
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

        {showCreateFirst ? (
          <View style={styles.setupBlock}>
            <SubscriptionsCreateFirstGuide onCreatePress={() => setCreateSheetOpen(true)} />
          </View>
        ) : null}

        {showComplete ? (
          <View style={styles.completeBlock}>
            <SubscriptionsSetupCompleteCard
              plan={latestPlan}
              onContinue={() => {
                void Haptics.selectionAsync().catch(() => {});
                setHubTab(SUBSCRIPTIONS_HUB_PLANS);
                setPhase('live');
              }}
            />
          </View>
        ) : null}

        {showLiveHub ? (
          <>
            <SubscriptionsHubTabs value={hubTab} onChange={setHubTab} />

            {hubTab === SUBSCRIPTIONS_HUB_PLANS ? (
              <>
                <View style={styles.plansHeader}>
                  <AppText style={styles.plansHeaderTitle}>Your plans</AppText>
                  <AppText
                    accessibilityRole="button"
                    style={styles.addPlanLabel}
                    onPress={() => setCreateSheetOpen(true)}
                  >
                    Add plan
                  </AppText>
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
                          navigation.navigate(ROUTES.SUBSCRIPTION_PLAN_DETAIL, { plan })
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
                    options={SUBSCRIPTIONS_TAB_OPTIONS}
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
                        customerName={card.customerName}
                        footerLabel={card.footerLabel}
                        nextVisitLabel={card.nextVisitLabel}
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

      <SubscriptionsCreatePlanSheet
        submitting={savingPlan}
        visible={createSheetOpen}
        onRequestClose={() => {
          if (!savingPlan) setCreateSheetOpen(false);
        }}
        onSubmit={handleSavePlan}
      />

      <StripeConnectLaunchOverlay visible={connectSubmitting} />
    </SafeAreaView>
  );
}
