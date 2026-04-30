import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { AppText, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { NotificationSettingsScreenSkeleton } from '../components/NotificationSettingsScreenSkeleton';
import { useNotificationSettings } from '../hooks/useNotificationSettings';

function NotificationToggleRow({ title, subtitle, value, onValueChange, showDivider = true }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 14,
          paddingVertical: 12,
        },
        textBlock: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 4,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginTop: 2,
          opacity: 0.7,
        },
      }),
    [colors],
  );

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <AppText style={styles.title}>{title}</AppText>
          {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
        </View>
        <Switch
          thumbColor={value ? '#f8fafc' : '#f4f4f5'}
          trackColor={{ false: colors.borderStrong, true: '#10b981' }}
          value={value}
          onValueChange={onValueChange}
        />
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

/** More tab — notification preferences (loads via query; toggles update cache until API exists). */
export function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);

  const { prefs, isLoading, isFetching, loadError, refetch, setPref } = useNotificationSettings();

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
          gap: 16,
          paddingBottom: scrollBottomPad,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
        card: {
          gap: 2,
        },
        title: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginBottom: 4,
        },
        helper: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 19,
          marginBottom: 12,
        },
        updatingHint: {
          color: colors.textMuted,
          fontSize: 13,
          marginBottom: -8,
        },
      }),
    [colors, scrollBottomPad],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={refetch}
        refreshing={Boolean(isFetching && !isLoading)}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isFetching, isLoading, refetch],
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
        </ScrollView>
      </View>
    );
  }

  if (!prefs) {
    return null;
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {isFetching && !isLoading ? <AppText style={styles.updatingHint}>Updating…</AppText> : null}
        <SurfaceCard style={styles.card}>
          <AppText style={styles.title}>Push notifications</AppText>
          <AppText style={styles.helper}>
            Choose what you want to hear about. These controls are mock UI for now.
          </AppText>

          <NotificationToggleRow
            subtitle="Get notified as soon as a customer books."
            title="New bookings"
            value={prefs.newBookings}
            onValueChange={(v) => setPref('newBookings', v)}
          />
          <NotificationToggleRow
            subtitle="Reschedules, cancellations, and confirmations."
            title="Booking changes"
            value={prefs.bookingChanges}
            onValueChange={(v) => setPref('bookingChanges', v)}
          />
          <NotificationToggleRow
            subtitle="Successful payments and payout activity."
            title="Payments"
            value={prefs.paymentUpdates}
            onValueChange={(v) => setPref('paymentUpdates', v)}
          />
          <NotificationToggleRow
            showDivider={false}
            subtitle="Product tips and optional announcements."
            title="Tips and updates"
            value={prefs.marketingTips}
            onValueChange={(v) => setPref('marketingTips', v)}
          />
        </SurfaceCard>
      </ScrollView>
    </View>
  );
}
