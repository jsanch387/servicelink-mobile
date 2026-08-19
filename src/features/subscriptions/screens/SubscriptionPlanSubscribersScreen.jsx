import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, FilterPills, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { SubscriptionMemberCard } from '../components/SubscriptionMemberCard';
import { SubscriptionPlanSubscribersSkeleton } from '../components/SubscriptionPlanSubscribersSkeleton';
import {
  SUBSCRIPTIONS_LIST_EMPTY,
  SUBSCRIPTIONS_TAB_ACTIVE,
  SUBSCRIPTIONS_TAB_CANCELED,
} from '../constants';
import { filterSubscribersByListTab, useMembershipPlan } from '../hooks/useMembershipCatalog';
import { useSubscriptionsAccess } from '../hooks/useSubscriptionsAccess';
import { mapSubscriptionListCard } from '../utils/subscriptionPresentation';

/**
 * People on a single plan — opens from plan detail.
 */
export function SubscriptionPlanSubscribersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const routePlan = route.params?.plan ?? null;
  const planId = String(route.params?.planId ?? routePlan?.id ?? '').trim();
  const { plan, planSubscribers, isPending, errorMessage } = useMembershipPlan(planId);
  const { featureEnabled } = useSubscriptionsAccess();
  const [listTab, setListTab] = useState(() => {
    const initial = String(route.params?.initialListTab ?? '').trim();
    return initial === SUBSCRIPTIONS_TAB_CANCELED
      ? SUBSCRIPTIONS_TAB_CANCELED
      : SUBSCRIPTIONS_TAB_ACTIVE;
  });

  const hasCanceled = useMemo(
    () => planSubscribers.some((row) => row.isCanceledList),
    [planSubscribers],
  );

  const activeCount = useMemo(
    () => planSubscribers.filter((row) => row.isActiveList).length,
    [planSubscribers],
  );
  const canceledCount = useMemo(
    () => planSubscribers.filter((row) => row.isCanceledList).length,
    [planSubscribers],
  );

  const tabOptions = useMemo(
    () => [
      { key: SUBSCRIPTIONS_TAB_ACTIVE, label: `Active (${activeCount})` },
      { key: SUBSCRIPTIONS_TAB_CANCELED, label: `Canceled (${canceledCount})` },
    ],
    [activeCount, canceledCount],
  );

  const cards = useMemo(() => {
    return filterSubscribersByListTab(planSubscribers, listTab).map(mapSubscriptionListCard);
  }, [listTab, planSubscribers]);

  const listCountLabel = useMemo(() => {
    if (hasCanceled) return null;
    if (activeCount === 0) return null;
    return `${activeCount} subscriber${activeCount === 1 ? '' : 's'}`;
  }, [activeCount, hasCanceled]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Subscribers',
    });
  }, [navigation]);

  const handlePressMember = useCallback(
    (subscriptionId) => {
      navigation.navigate(ROUTES.SUBSCRIPTION_DETAIL, { subscriptionId });
    },
    [navigation],
  );

  const empty = SUBSCRIPTIONS_LIST_EMPTY[listTab];

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
          gap: 12,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 14,
        },
        emptyWrap: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 16,
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
        countMeta: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          marginBottom: -2,
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

  if (isPending && !plan && planSubscribers.length === 0) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <SubscriptionPlanSubscribersSkeleton />
        </ScrollView>
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
        {errorMessage && planSubscribers.length === 0 ? (
          <SurfaceCard padding="md">
            <InlineCardError message={errorMessage} />
          </SurfaceCard>
        ) : null}

        {hasCanceled ? (
          <FilterPills onSelect={setListTab} options={tabOptions} selectedKey={listTab} />
        ) : listCountLabel ? (
          <AppText style={styles.countMeta}>{listCountLabel}</AppText>
        ) : null}

        {cards.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>
              {empty?.title ??
                (listTab === SUBSCRIPTIONS_TAB_CANCELED
                  ? 'No canceled subscribers'
                  : 'No active subscribers')}
            </AppText>
            <AppText style={styles.emptyBody}>
              {empty?.body ?? 'Subscribers on this subscription will show up here.'}
            </AppText>
          </View>
        ) : (
          cards.map((card) => (
            <SubscriptionMemberCard
              key={card.id}
              cadenceLabel={card.cadenceLabel}
              customerName={card.customerName}
              planName={card.planName}
              statusLabel={card.statusLabel}
              statusRaw={card.statusRaw}
              onPress={() => handlePressMember(card.id)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
