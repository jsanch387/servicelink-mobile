import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Divider } from '../../../components/ui';
import { FloatingCreateMenu } from '../components/FloatingCreateMenu';
import { LinkStatsSection } from '../components/LinkStatsSection';
import { NextUpCard } from '../components/NextUpCard';
import { RestOfTodayCard } from '../components/restOfToday';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { normalizeBusinessSlug } from '../utils/bookingLink';
import { useTheme } from '../../../theme';

export function HomeScreen() {
  const { colors } = useTheme();
  const dashboard = useHomeDashboard();
  const tabBarHeight = useBottomTabBarHeight();
  /** Extra space so content clears the custom tab bar (hook can be 0 with custom `tabBar`). */
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);

  /** Only `business_profiles.business_slug` from Supabase — no app defaults. */
  const slug = useMemo(
    () => normalizeBusinessSlug(dashboard.business?.business_slug),
    [dashboard.business?.business_slug],
  );
  const businessDisplayName = useMemo(() => {
    const rawName = dashboard.business?.business_name?.trim();
    if (!rawName) {
      return 'there';
    }
    return rawName;
  }, [dashboard.business?.business_name]);

  const profileViews = useMemo(() => {
    if (dashboard.isPendingBusiness) {
      return null;
    }
    return Number(dashboard.business?.profile_views ?? 0);
  }, [dashboard.business, dashboard.isPendingBusiness]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await dashboard.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [dashboard]);

  const sectionLoading = dashboard.isPendingBusiness || dashboard.isPendingBookings;

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
          paddingBottom: scrollBottomPad,
          paddingHorizontal: 20,
          paddingTop: 8,
        },
        sectionLabel: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginTop: 30,
        },
        sectionLabelFirst: {
          marginTop: 10,
        },
        profileRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
          marginTop: 6,
        },
        profileLeft: {
          alignItems: 'center',
          flexDirection: 'row',
          flexShrink: 1,
          minWidth: 0,
        },
        profileName: {
          color: colors.text,
          flexShrink: 1,
          fontSize: 18,
          fontWeight: '700',
          marginLeft: 10,
          minWidth: 0,
        },
        bellButton: {
          alignItems: 'center',
          borderRadius: 16,
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        headerDivider: {
          marginBottom: 8,
        },
        syncHint: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
          marginTop: 0,
          textAlign: 'left',
        },
      }),
    [colors, scrollBottomPad],
  );

  const handleCreateAppointment = useCallback(() => {
    Alert.alert('Create appointment', 'Appointment creation flow coming next.');
  }, []);

  const handleCreateQuote = useCallback(() => {
    Alert.alert('Create quote', 'Quote creation flow coming next.');
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <AppShellGlow />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.profileRow}>
          <View style={styles.profileLeft}>
            <Ionicons color={colors.textMuted} name="person-circle-outline" size={30} />
            <AppText numberOfLines={1} style={styles.profileName}>
              {businessDisplayName}
            </AppText>
          </View>
          <Pressable
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            style={styles.bellButton}
          >
            <Ionicons color={colors.textMuted} name="notifications-outline" size={22} />
          </Pressable>
        </View>
        <Divider style={styles.headerDivider} />
        {dashboard.isFetching && !dashboard.isLoading ? (
          <AppText style={[styles.syncHint, { color: colors.textMuted }]}>Updating…</AppText>
        ) : null}
        <AppText style={[styles.sectionLabel, styles.sectionLabelFirst]}>Next Up</AppText>
        <NextUpCard
          bookingsError={dashboard.bookingsError}
          businessError={dashboard.businessError}
          isLoading={sectionLoading}
          nextBooking={dashboard.nextBooking}
          subtitle={dashboard.nextSubtitle}
          title={dashboard.nextBookingTitle}
        />

        <AppText style={styles.sectionLabel}>Booking link</AppText>
        <LinkStatsSection
          businessError={dashboard.businessError}
          isLoading={dashboard.isPendingBusiness}
          profileViews={profileViews}
          slug={slug}
        />

        <AppText style={styles.sectionLabel}>Rest of Today</AppText>
        <RestOfTodayCard
          error={dashboard.todayBookingsError}
          isLoading={dashboard.isPendingTodayBookings}
          items={dashboard.todayTimelineItems}
        />
      </ScrollView>
      <FloatingCreateMenu
        bottom={30}
        onCreateAppointment={handleCreateAppointment}
        onCreateQuote={handleCreateQuote}
      />
    </SafeAreaView>
  );
}
