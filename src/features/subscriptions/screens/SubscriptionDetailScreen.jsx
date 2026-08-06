import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InfoSection, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { SubscriptionDetailActions } from '../components/SubscriptionDetailActions';
import { SubscriptionDetailBody } from '../components/SubscriptionDetailBody';
import {
  SUBSCRIPTION_CANCEL_ALERT_MESSAGE,
  SUBSCRIPTION_CANCEL_ALERT_TITLE,
  SUBSCRIPTION_DETAIL_NOT_FOUND,
} from '../constants';
import { MOCK_SUBSCRIPTIONS } from '../mock/mockSubscriptions';
import { mapSubscriptionDetailModel } from '../utils/subscriptionPresentation';

export function SubscriptionDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const subscriptionId = String(route.params?.subscriptionId ?? '').trim() || undefined;

  const [linkCopyFeedback, setLinkCopyFeedback] = useState(false);
  const [canceledIds, setCanceledIds] = useState(() => new Set());

  const sourceRow = useMemo(() => {
    if (!subscriptionId) return null;
    return MOCK_SUBSCRIPTIONS.find((row) => row.id === subscriptionId) ?? null;
  }, [subscriptionId]);

  const model = useMemo(() => {
    if (!sourceRow) return null;
    const locallyCanceled = canceledIds.has(sourceRow.id);
    const row = locallyCanceled
      ? {
          ...sourceRow,
          status: 'canceled',
          cancelAtPeriodEnd: false,
          nextVisitDate: null,
          nextVisitTime: null,
        }
      : sourceRow;
    return mapSubscriptionDetailModel(row);
  }, [canceledIds, sourceRow]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: model?.customerName ? model.customerName : 'Subscription',
    });
  }, [model?.customerName, navigation]);

  const handleViewCustomer = useCallback(() => {
    if (!model?.customerId) return;
    // Mock customer ids won't resolve — keep the affordance for UX review.
    Alert.alert(
      'Customer profile',
      'In production this opens the customer. Mock IDs are not wired to CRM yet.',
    );
  }, [model?.customerId]);

  const handleCopyManageLink = useCallback(async () => {
    const link = String(model?.manageLink ?? '').trim();
    if (!link) return;
    await Clipboard.setStringAsync(link);
    void Haptics.selectionAsync().catch(() => {});
    setLinkCopyFeedback(true);
    setTimeout(() => setLinkCopyFeedback(false), 2000);
  }, [model?.manageLink]);

  const handleConfirmCancel = useCallback(() => {
    if (!model?.id) return;
    setCanceledIds((prev) => {
      const next = new Set(prev);
      next.add(model.id);
      return next;
    });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert(
      'Subscription canceled',
      'Mock only — nothing was sent to Stripe. They would keep access until period end.',
    );
  }, [model?.id]);

  const handleCancel = useCallback(() => {
    if (!model?.canCancel) return;
    Alert.alert(SUBSCRIPTION_CANCEL_ALERT_TITLE, SUBSCRIPTION_CANCEL_ALERT_MESSAGE, [
      { text: 'Keep subscription', style: 'cancel' },
      {
        text: 'Cancel subscription',
        style: 'destructive',
        onPress: handleConfirmCancel,
      },
    ]);
  }, [handleConfirmCancel, model?.canCancel]);

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
    const phone = String(model.customerPhone ?? '').trim();
    if (phone) {
      rows.push({
        key: 'phone',
        icon: 'call-outline',
        value: phone,
        interactionStyle: 'none',
      });
    }
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
      }),
    [colors],
  );

  if (!subscriptionId || !model) {
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

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <SubscriptionDetailBody model={model} />
        <InfoSection rowGap={14} rows={customerRows} title="Customer" />
        <SubscriptionDetailActions
          canCancel={model.canCancel}
          canCopyManageLink={model.canCopyManageLink}
          cancelNote={model.canCancelImmediateNote}
          linkCopied={linkCopyFeedback}
          onCancel={handleCancel}
          onCopyManageLink={() => void handleCopyManageLink()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
