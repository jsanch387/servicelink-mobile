import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  AppText,
  Button,
  Divider,
  InlineCardError,
  NewLabel,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { usePushNotificationPermission } from '../../notifications/hooks/usePushNotificationPermission';
import { useCustomerSmsAccess } from '../../sms/hooks/useCustomerSmsAccess';
import { NotificationSettingsScreenSkeleton } from '../components/NotificationSettingsScreenSkeleton';

const WHAT_YOU_GET_SECTION_TITLE = "What you'll get";
const TEXTS_SENT_TITLE = 'Texts sent';
const TEXTS_SENT_SUBTITLE = 'See texts sent to your customers.';
const CUSTOMER_NOTIFICATIONS_TITLE = 'Text updates';
const CUSTOMER_NOTIFICATIONS_SUBTITLE = 'Text customer updates';
const CUSTOMER_TEXTS_SECTION_TITLE = 'Customer notifications';

const WHAT_YOU_GET = [
  {
    title: 'Bookings',
    subtitle: 'New appointments, updates, and cancellations.',
    icon: 'calendar-outline',
  },
  {
    title: 'Quotes',
    subtitle: 'New requests and quote decisions.',
    icon: 'document-text-outline',
  },
];

/** More tab — device push status, what alerts cover, and customer text history. */
export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
  const { status, loadError, isLoading, refresh, requestPermission } =
    usePushNotificationPermission();
  const smsAccess = useCustomerSmsAccess();
  const [isRequesting, setIsRequesting] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refresh]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void onRefresh()}
        refreshing={isManualRefreshing}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isManualRefreshing, onRefresh],
  );

  const statusLabel = useMemo(() => {
    if (Platform.OS === 'web' || status === 'unavailable') {
      return 'Not available here';
    }
    if (status === 'granted') {
      return 'On';
    }
    if (status === 'denied') {
      return 'Off';
    }
    if (status === 'undetermined') {
      return 'Not set';
    }
    return '—';
  }, [status]);

  const statusIsOn = status === 'granted';

  const primaryAction = useMemo(() => {
    if (Platform.OS === 'web' || status === 'unavailable') {
      return null;
    }
    if (status === 'denied') {
      return {
        title: 'Open system settings',
        hint: 'Opens ServiceLink in iOS or Android settings so you can allow notifications.',
        onPress: () => void Linking.openSettings(),
      };
    }
    if (status === 'undetermined') {
      return {
        title: 'Allow notifications',
        hint: 'Shows the system prompt to allow ServiceLink to send alerts.',
        onPress: async () => {
          setIsRequesting(true);
          try {
            await requestPermission();
          } finally {
            setIsRequesting(false);
          }
        },
      };
    }
    return null;
  }, [requestPermission, status]);

  const footnote = useMemo(() => {
    if (Platform.OS === 'web' || status === 'unavailable') {
      return 'Push notifications are only on our iOS and Android apps.';
    }
    if (status === 'denied') {
      return "If you previously chose Don't allow, use the button below. Your phone will not show the permission popup again.";
    }
    return null;
  }, [status]);

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
          alignItems: 'stretch',
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
          width: '100%',
        },
        section: {
          alignSelf: 'stretch',
          marginTop: 22,
        },
        sectionFirst: {
          marginTop: 0,
        },
        sectionTitleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 8,
          minHeight: 24,
        },
        sectionTitleWithBadge: {
          alignItems: 'center',
          flexDirection: 'row',
        },
        sectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        card: {
          gap: 0,
          overflow: 'hidden',
        },
        notifyRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        notifyIcon: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          height: 32,
          justifyContent: 'center',
          marginTop: 1,
          width: 32,
        },
        notifyCopy: {
          flex: 1,
          gap: 3,
          minWidth: 0,
        },
        notifyTitle: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: 20,
        },
        notifySub: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 16,
        },
        listDivider: {
          marginLeft: 58,
          marginVertical: 0,
        },
        linkRowPress: {
          alignSelf: 'stretch',
        },
        linkRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        linkRowPressed: {
          opacity: 0.72,
        },
        linkCopy: {
          flex: 1,
          gap: 3,
          minWidth: 0,
        },
        statusRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        statusKey: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
        },
        statusValue: {
          fontSize: 15,
          fontWeight: '700',
          letterSpacing: -0.1,
        },
        statusOn: {
          color: colors.textSuccess,
        },
        statusOff: {
          color: colors.textMuted,
        },
        footnoteDivider: {
          marginHorizontal: 14,
          marginVertical: 0,
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 19,
          paddingBottom: 12,
          paddingHorizontal: 14,
          paddingTop: 10,
        },
        actions: {
          alignSelf: 'stretch',
          gap: 10,
          marginTop: 22,
        },
        loadErrorRetry: {
          marginTop: 8,
        },
      }),
    [colors, scrollBottomPad],
  );

  const statusValueStyle = useMemo(
    () => [styles.statusValue, statusIsOn ? styles.statusOn : styles.statusOff],
    [statusIsOn, styles.statusOff, styles.statusOn, styles.statusValue],
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <NotificationSettingsScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <InlineCardError message={loadError} />
          <Button
            accessibilityHint="Attempts to read notification permission again"
            accessibilityLabel="Try again"
            fullWidth
            loading={isManualRefreshing}
            style={styles.loadErrorRetry}
            title="Try again"
            variant="secondary"
            onPress={() => void onRefresh()}
          />
        </ScrollView>
      </View>
    );
  }

  const showNativeDevice = Platform.OS !== 'web' && status !== 'unavailable';
  const showCustomerTextsSection = smsAccess.featureEnabled && smsAccess.isReady;
  const customerTextsTitle = smsAccess.canUseSms ? TEXTS_SENT_TITLE : CUSTOMER_NOTIFICATIONS_TITLE;
  const customerTextsSubtitle = smsAccess.canUseSms
    ? TEXTS_SENT_SUBTITLE
    : CUSTOMER_NOTIFICATIONS_SUBTITLE;
  const customerTextsRoute = smsAccess.canUseSms ? ROUTES.SENT_TEXTS : ROUTES.CUSTOMER_SMS_UPSELL;
  const customerTextsHint = smsAccess.canUseSms
    ? 'Opens texts you’ve sent to customers'
    : 'Learn about customer text updates';

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.sectionFirst}>
          <View style={styles.sectionTitleRow}>
            <AppText style={styles.sectionTitle}>{WHAT_YOU_GET_SECTION_TITLE}</AppText>
          </View>
          <SurfaceCard padding="none" style={styles.card}>
            {WHAT_YOU_GET.map((item, index) => (
              <View key={item.title}>
                {index > 0 ? <Divider style={styles.listDivider} /> : null}
                <View style={styles.notifyRow}>
                  <View style={styles.notifyIcon}>
                    <Ionicons color={colors.textSecondary} name={item.icon} size={16} />
                  </View>
                  <View style={styles.notifyCopy}>
                    <AppText style={styles.notifyTitle}>{item.title}</AppText>
                    <AppText style={styles.notifySub}>{item.subtitle}</AppText>
                  </View>
                </View>
              </View>
            ))}
          </SurfaceCard>
        </View>

        {showCustomerTextsSection ? (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionTitleWithBadge}>
                <AppText style={styles.sectionTitle}>{CUSTOMER_TEXTS_SECTION_TITLE}</AppText>
                <NewLabel />
              </View>
            </View>
            <SurfaceCard padding="none" style={styles.card}>
              <Pressable
                accessibilityHint={customerTextsHint}
                accessibilityLabel={customerTextsTitle}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.linkRowPress,
                  pressed ? styles.linkRowPressed : null,
                ]}
                onPress={() => navigation.navigate(customerTextsRoute)}
              >
                <View style={styles.linkRow}>
                  <View style={styles.notifyIcon}>
                    <Ionicons
                      color={colors.textSecondary}
                      name="chatbubble-ellipses-outline"
                      size={16}
                    />
                  </View>
                  <View style={styles.linkCopy}>
                    <AppText style={styles.notifyTitle}>{customerTextsTitle}</AppText>
                    <AppText style={styles.notifySub}>{customerTextsSubtitle}</AppText>
                  </View>
                  <Ionicons color={colors.textMuted} name="chevron-forward" size={16} />
                </View>
              </Pressable>
            </SurfaceCard>
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppText style={styles.sectionTitle}>This device</AppText>
          </View>
          <SurfaceCard padding="none" style={styles.card}>
            <View style={styles.statusRow}>
              <AppText style={styles.statusKey}>Push alerts</AppText>
              <AppText style={statusValueStyle}>{statusLabel}</AppText>
            </View>
            {footnote ? (
              <>
                <Divider style={styles.footnoteDivider} />
                <AppText style={styles.footnote}>{footnote}</AppText>
              </>
            ) : null}
          </SurfaceCard>
        </View>

        {showNativeDevice ? (
          <View style={styles.actions}>
            {primaryAction ? (
              <Button
                accessibilityHint={primaryAction.hint}
                accessibilityLabel={primaryAction.title}
                fullWidth
                loading={isRequesting}
                title={primaryAction.title}
                onPress={() => void primaryAction.onPress()}
              />
            ) : null}
            {status === 'granted' ? (
              <Button
                accessibilityHint="Opens ServiceLink notification options in system settings"
                accessibilityLabel="Open system notification settings"
                fullWidth
                title="Open system settings"
                variant="secondary"
                onPress={() => void Linking.openSettings()}
              />
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
