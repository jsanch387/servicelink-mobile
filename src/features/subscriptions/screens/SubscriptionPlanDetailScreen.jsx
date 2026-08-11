import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { PlanDetailBody } from '../components/PlanDetailBody';
import { MOCK_MEMBERSHIPS_PUBLIC_LINK } from '../mock/mockSubscriptions';
import { getMockPlanSubscribers } from '../utils/getMockPlanSubscribers';

/**
 * Owner plan detail — Stripe/Uber-simple: facts, one menu, delete.
 */
export function SubscriptionPlanDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const plan = route.params?.plan ?? null;
  const [linkCopied, setLinkCopied] = useState(false);

  const subscriberCount = useMemo(() => getMockPlanSubscribers(plan).length, [plan]);

  const handleEdit = useCallback(() => {
    Alert.alert('Edit plan', 'Editing plans is coming next.');
  }, []);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete plan?', `Remove "${plan?.name ?? 'this plan'}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Delete plan', 'Deleting plans is coming next.');
        },
      },
    ]);
  }, [plan?.name]);

  const handleOpenSubscribers = useCallback(() => {
    if (!plan?.id) return;
    navigation.navigate(ROUTES.SUBSCRIPTION_PLAN_SUBSCRIBERS, { plan });
  }, [navigation, plan]);

  const handleCopyLink = useCallback(async () => {
    await Clipboard.setStringAsync(MOCK_MEMBERSHIPS_PUBLIC_LINK);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: '',
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
          paddingBottom: 40,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 14,
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
        <PlanDetailBody
          linkCopied={linkCopied}
          plan={plan}
          subscriberCount={subscriberCount}
          onCopyLink={() => void handleCopyLink()}
          onDelete={handleDelete}
          onEdit={handleEdit}
          onOpenSubscribers={handleOpenSubscribers}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
