import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { Linking, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, Divider, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { usePushNotificationPermission } from '../../notifications/hooks/usePushNotificationPermission';
import { useTheme } from '../../../theme';
import { NotificationSettingsScreenSkeleton } from '../components/NotificationSettingsScreenSkeleton';

/** More tab — device push permission and what ServiceLink uses it for. */
export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
  const { status, loadError, isLoading, refresh, requestPermission } =
    usePushNotificationPermission();
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
        sectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        card: {
          gap: 0,
        },
        notifyRow: {
          gap: 4,
          paddingVertical: 14,
        },
        notifyTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          lineHeight: 21,
        },
        notifySub: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 16,
        },
        listDivider: {
          marginVertical: 0,
        },
        statusRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: 12,
          paddingVertical: 4,
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
          marginTop: 12,
          marginBottom: 12,
        },
        footnote: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 19,
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
            <AppText style={styles.sectionTitle}>What we send</AppText>
          </View>
          <SurfaceCard style={styles.card}>
            <View style={styles.notifyRow}>
              <AppText style={styles.notifyTitle}>New appointments</AppText>
              <AppText style={styles.notifySub}>When a customer books with you.</AppText>
            </View>
            <Divider style={styles.listDivider} />
            <View style={styles.notifyRow}>
              <AppText style={styles.notifyTitle}>Quote requests</AppText>
              <AppText style={styles.notifySub}>When someone asks for a quote.</AppText>
            </View>
          </SurfaceCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <AppText style={styles.sectionTitle}>This device</AppText>
          </View>
          <SurfaceCard style={styles.card}>
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
