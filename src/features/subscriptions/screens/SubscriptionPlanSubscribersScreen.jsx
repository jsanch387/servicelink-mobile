import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { SubscriptionMemberCard } from '../components/SubscriptionMemberCard';
import { getMockPlanSubscribers } from '../utils/getMockPlanSubscribers';
import { mapSubscriptionListCard } from '../utils/subscriptionPresentation';

/**
 * People on a single plan — opens from plan detail when there are subscribers.
 */
export function SubscriptionPlanSubscribersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const plan = route.params?.plan ?? null;

  const cards = useMemo(() => getMockPlanSubscribers(plan).map(mapSubscriptionListCard), [plan]);

  useLayoutEffect(() => {
    const count = cards.length;
    navigation.setOptions({
      title: count > 0 ? `Subscribers · ${count}` : 'Subscribers',
    });
  }, [cards.length, navigation]);

  const handlePressMember = useCallback(
    (subscriptionId) => {
      navigation.navigate(ROUTES.SUBSCRIPTION_DETAIL, { subscriptionId });
    },
    [navigation],
  );

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
          gap: 12,
          paddingBottom: 36,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 14,
        },
        emptyWrap: {
          alignItems: 'center',
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
      }),
    [colors],
  );

  if (!plan?.id) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <View style={[styles.content, { paddingTop: 20 }]}>
          <SurfaceCard padding="md">
            <InlineCardError message="We could not open this plan. Go back and try again." />
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
        {cards.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>No subscribers yet</AppText>
            <AppText style={styles.emptyBody}>
              When customers join {plan.name || 'this plan'}, they’ll show up here.
            </AppText>
          </View>
        ) : (
          cards.map((card) => (
            <SubscriptionMemberCard
              key={card.id}
              customerName={card.customerName}
              footerLabel={card.footerLabel}
              nextVisitLabel={card.nextVisitLabel}
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
