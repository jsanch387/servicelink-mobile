import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, FilterPills } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { SubscriptionMemberCard } from '../components/SubscriptionMemberCard';
import { SubscriptionPlanCard } from '../components/SubscriptionPlanCard';
import { SubscriptionsCreateFirstGuide } from '../components/SubscriptionsCreateFirstGuide';
import { SubscriptionsCreatePlanSheet } from '../components/SubscriptionsCreatePlanSheet';
import { SubscriptionsHubTabs } from '../components/SubscriptionsHubTabs';
import { SubscriptionsSetupCard } from '../components/SubscriptionsSetupCard';
import { SubscriptionsSetupCompleteCard } from '../components/SubscriptionsSetupCompleteCard';
import { SubscriptionsSetupProgress } from '../components/SubscriptionsSetupProgress';
import {
  SUBSCRIPTIONS_HUB_PLANS,
  SUBSCRIPTIONS_HUB_SUBSCRIBERS,
  SUBSCRIPTIONS_LIST_EMPTY,
  SUBSCRIPTIONS_PLANS_EMPTY,
  SUBSCRIPTIONS_TAB_ACTIVE,
  SUBSCRIPTIONS_TAB_OPTIONS,
} from '../constants';
import {
  SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP,
  SUBSCRIPTIONS_NEEDS_PAYMENTS_BODY,
  SUBSCRIPTIONS_NEEDS_PAYMENTS_CTA,
  SUBSCRIPTIONS_NEEDS_PAYMENTS_TITLE,
} from '../constants/setupCopy';
import { MOCK_SUBSCRIPTIONS } from '../mock/mockSubscriptions';
import { mapSubscriptionListCard } from '../utils/subscriptionPresentation';

/** @typedef {'intro' | 'needs_payments' | 'create_first' | 'complete' | 'live'} SetupPhase */

/**
 * Design preview: walk More → Subscriptions first-open → create plan → celebrate → hub.
 * Long-press the preview caption to reset or toggle the payments gate.
 */
export function SubscriptionsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();

  const [phase, setPhase] = useState(/** @type {SetupPhase} */ ('intro'));
  const [paymentsReady, setPaymentsReady] = useState(true);
  const [plans, setPlans] = useState(
    /** @type {Array<import('../mock/mockSubscriptions').MockSubscriptionPlan & { offeredCadenceKeys?: string[]; cadenceKey?: string }>} */ ([]),
  );
  const [latestPlan, setLatestPlan] = useState(
    /** @type {(import('../mock/mockSubscriptions').MockSubscriptionPlan & { offeredCadenceKeys?: string[]; cadenceKey?: string }) | null} */ (
      null
    ),
  );
  const [hubTab, setHubTab] = useState(SUBSCRIPTIONS_HUB_PLANS);
  const [showDemoMembers, setShowDemoMembers] = useState(false);
  const [listTab, setListTab] = useState(SUBSCRIPTIONS_TAB_ACTIVE);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const openDetail = useCallback(
    (subscriptionId) => {
      navigation.navigate(ROUTES.SUBSCRIPTION_DETAIL, { subscriptionId });
    },
    [navigation],
  );

  const handleTurnOn = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (!paymentsReady) {
      setPhase('needs_payments');
      return;
    }
    setPhase('create_first');
  }, [paymentsReady]);

  const handleSavePlan = useCallback(
    async (draft) => {
      setSavingPlan(true);
      try {
        await new Promise((r) => setTimeout(r, 350));
        const plan = {
          id: `plan_${Date.now()}`,
          name: draft.name,
          serviceName: draft.serviceName,
          priceCents: draft.priceCents,
          interval: /** @type {'month'} */ ('month'),
          offeredCadenceKeys: draft.offeredCadenceKeys,
          visitsPerPeriod: 1,
          isPublic: true,
        };
        setPlans((prev) => [...prev, plan]);
        setLatestPlan(plan);
        setCreateSheetOpen(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        if (phase === 'create_first' || plans.length === 0) {
          setPhase('complete');
        } else {
          setPhase('live');
          setHubTab(SUBSCRIPTIONS_HUB_PLANS);
        }
      } finally {
        setSavingPlan(false);
      }
    },
    [phase, plans.length],
  );

  const handlePreviewMenu = useCallback(() => {
    Alert.alert('Subscriptions preview', 'Reset or tweak this design walkthrough.', [
      {
        text: 'Reset to first open',
        onPress: () => {
          setPhase('intro');
          setPlans([]);
          setLatestPlan(null);
          setShowDemoMembers(false);
          setHubTab(SUBSCRIPTIONS_HUB_PLANS);
          setListTab(SUBSCRIPTIONS_TAB_ACTIVE);
        },
      },
      {
        text: paymentsReady ? 'Simulate: payments not ready' : 'Simulate: payments ready',
        onPress: () => {
          const next = !paymentsReady;
          setPaymentsReady(next);
          setPhase(next ? 'intro' : 'needs_payments');
          setPlans([]);
          setLatestPlan(null);
          setShowDemoMembers(false);
        },
      },
      {
        text: showDemoMembers ? 'Hide demo subscribers' : 'Show demo subscribers',
        onPress: () => {
          setShowDemoMembers((v) => !v);
          if (plans.length === 0) {
            const demoPlan = {
              id: 'plan_monthly_wash',
              name: 'Monthly Wash',
              serviceName: 'Exterior Wash',
              priceCents: 10000,
              interval: /** @type {'month'} */ ('month'),
              offeredCadenceKeys: ['monthly', 'every_2_months', 'every_3_months'],
              visitsPerPeriod: 1,
              isPublic: true,
            };
            setPlans([demoPlan]);
            setLatestPlan(demoPlan);
            setPhase('live');
            setHubTab(SUBSCRIPTIONS_HUB_SUBSCRIBERS);
          } else {
            setHubTab(SUBSCRIPTIONS_HUB_SUBSCRIBERS);
          }
        },
      },
      { text: 'Close', style: 'cancel' },
    ]);
  }, [paymentsReady, plans.length, showDemoMembers]);

  const cardsByTab = useMemo(() => {
    const grouped = {
      active: [],
      past_due: [],
      canceled: [],
    };
    if (!showDemoMembers) return grouped;
    for (const row of MOCK_SUBSCRIPTIONS) {
      const bucket = grouped[row.status];
      if (!bucket) continue;
      bucket.push(mapSubscriptionListCard(row));
    }
    return grouped;
  }, [showDemoMembers]);

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
        mockBanner: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 14,
          textAlign: 'center',
        },
        setupBlock: {
          gap: 14,
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
        demoToggle: {
          marginTop: 20,
          width: '100%',
        },
        shareNudge: {
          marginTop: 16,
          width: '100%',
        },
      }),
    [colors, tabBarHeight],
  );

  const cards = cardsByTab[listTab] ?? [];
  const emptyCopy = showDemoMembers
    ? (SUBSCRIPTIONS_LIST_EMPTY[listTab] ?? SUBSCRIPTIONS_LIST_EMPTY.active)
    : SUBSCRIPTIONS_MEMBERS_EMPTY_AFTER_SETUP;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <Pressable accessibilityRole="button" onLongPress={handlePreviewMenu}>
          <AppText style={styles.mockBanner}>Design preview - long-press to reset</AppText>
        </Pressable>

        {phase === 'intro' ? (
          <View style={styles.setupBlock}>
            <SubscriptionsSetupProgress activeKey="turn_on" completedKeys={[]} />
            <SubscriptionsSetupCard onTurnOn={handleTurnOn} />
          </View>
        ) : null}

        {phase === 'needs_payments' ? (
          <View style={styles.setupBlock}>
            <SubscriptionsSetupCard
              body={SUBSCRIPTIONS_NEEDS_PAYMENTS_BODY}
              bullets={[
                'Same Stripe account as booking checkout',
                'No second onboarding for most shops',
                'Come back here when charges are enabled',
              ]}
              cta={SUBSCRIPTIONS_NEEDS_PAYMENTS_CTA}
              title={SUBSCRIPTIONS_NEEDS_PAYMENTS_TITLE}
              onTurnOn={() => navigation.navigate(ROUTES.MORE_PAYMENTS)}
            />
            <Button fullWidth title="Back" variant="secondary" onPress={() => setPhase('intro')} />
          </View>
        ) : null}

        {phase === 'create_first' ? (
          <View style={styles.setupBlock}>
            <SubscriptionsCreateFirstGuide onCreatePress={() => setCreateSheetOpen(true)} />
          </View>
        ) : null}

        {phase === 'complete' && latestPlan ? (
          <View style={styles.setupBlock}>
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

        {phase === 'live' ? (
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

                {cards.length === 0 ? (
                  <View style={styles.emptyCentered}>
                    <AppText style={styles.emptyTitle}>{emptyCopy.title}</AppText>
                    <AppText style={styles.emptyBody}>{emptyCopy.body}</AppText>
                    {!showDemoMembers ? (
                      <View style={styles.demoToggle}>
                        <Button
                          fullWidth
                          title="Preview with demo subscribers"
                          variant="secondary"
                          onPress={() => setShowDemoMembers(true)}
                        />
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.list}>
                    {cards.map((row) => (
                      <SubscriptionMemberCard
                        customerName={row.customerName}
                        footerLabel={row.footerLabel}
                        key={row.id}
                        nextVisitLabel={row.nextVisitLabel}
                        planName={row.planName}
                        statusLabel={row.statusLabel}
                        statusRaw={row.statusRaw}
                        onPress={() => openDetail(row.id)}
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
    </SafeAreaView>
  );
}
