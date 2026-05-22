import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { FREE_TIER_BOOKINGS_LIMIT, freeTierBookingsLimitCopy } from '../../bookings/constants';
import { showWebAccountFeatureAlert, useSubscription } from '../../subscription';
import { FloatingCreateMenu } from '../components/FloatingCreateMenu';
import { HomeFreeBookingsUsageCard } from '../components/HomeFreeBookingsUsageCard';
import { HomeErrorBanner } from '../components/HomeErrorBanner';
import { LinkStatsSection } from '../components/LinkStatsSection';
import { NextUpCard } from '../components/NextUpCard';
import { RestOfTodayCard } from '../components/restOfToday';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useLinkViewsAnalytics } from '../hooks/useLinkViewsAnalytics';
import { useHomeQuickMarkComplete } from '../hooks/useHomeQuickMarkComplete';
import { computeHomeErrorPresentation } from '../utils/homeErrorPresentation';
import { normalizeBusinessSlug } from '../utils/bookingLink';
import { useTheme } from '../../../theme';
import { serviceCardTitleStyle } from '../../../utils/serviceCardTypography';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useNotificationUnreadCount } from '../../notifications/hooks/useNotificationUnreadCount';
import { useBookingsFreeTierUsage } from '../../bookings/hooks/useBookingsFreeTierUsage';
import { bookingsFreeTierCountQueryKey } from '../../bookings/queryKeys';
import { resolveFreeTierBookingUsed } from '../../bookings/utils/resolveFreeTierBookingUsed';

export function HomeScreen() {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { unreadCount } = useNotificationUnreadCount();
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const dashboard = useHomeDashboard();
  const markCompleteMutation = useHomeQuickMarkComplete();
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

  const linkViews = useLinkViewsAnalytics(dashboard.business?.id, {
    enabled: Boolean(dashboard.business?.id) && !dashboard.isPendingBusiness,
    hasProAccess,
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([dashboard.refetch(), linkViews.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [dashboard, linkViews]);

  const homeErrors = useMemo(
    () =>
      computeHomeErrorPresentation({
        businessError: dashboard.businessError,
        bookingsError: dashboard.bookingsError,
        todayBookingsError: dashboard.todayBookingsError,
      }),
    [dashboard.businessError, dashboard.bookingsError, dashboard.todayBookingsError],
  );

  const sectionLoading = dashboard.isPendingBusiness || dashboard.isPendingBookings;

  const nextUpSectionTitle = useMemo(
    () => (dashboard.spotlightMode === 'in_progress' ? 'In progress' : 'Next Up'),
    [dashboard.spotlightMode],
  );

  /** Show whenever we have a business so empty days still get the “nothing on the calendar” card. */
  const showTodayTimelineSection = Boolean(dashboard.business?.id);

  const showFreeTierBookingCount =
    isOwnerProfileLoaded &&
    !hasProAccess &&
    Boolean(dashboard.business?.id) &&
    !dashboard.businessError;

  const freeTierUsage = useBookingsFreeTierUsage(dashboard.business?.id, {
    enabled: showFreeTierBookingCount,
  });

  /** Prefer server `business_profiles.free_bookings_count`; fall back to head-count query. */
  const resolvedFreeBookingUsed = useMemo(
    () => resolveFreeTierBookingUsed(dashboard.business, freeTierUsage.used),
    [dashboard.business, freeTierUsage.used],
  );

  useFocusEffect(
    useCallback(() => {
      const bid = dashboard.business?.id;
      if (!bid || !isOwnerProfileLoaded || hasProAccess || dashboard.businessError) {
        return undefined;
      }
      void queryClient.invalidateQueries({ queryKey: bookingsFreeTierCountQueryKey(bid) });
      return undefined;
    }, [
      dashboard.business?.id,
      dashboard.businessError,
      hasProAccess,
      isOwnerProfileLoaded,
      queryClient,
    ]),
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
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
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
          marginBottom: 12,
          marginTop: 6,
        },
        headerDivider: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.border,
          height: 1,
          marginBottom: 16,
          opacity: 0.45,
          width: '100%',
        },
        profileName: {
          flex: 1,
          minWidth: 0,
          paddingRight: 12,
          ...serviceCardTitleStyle(colors),
        },
        bellButton: {
          alignItems: 'center',
          borderRadius: 16,
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        bellIconWrap: {
          alignItems: 'center',
          height: 24,
          justifyContent: 'center',
          position: 'relative',
          width: 24,
        },
        bellBadge: {
          borderRadius: 99,
          height: 8,
          position: 'absolute',
          right: -2,
          top: -2,
          width: 8,
        },
      }),
    [colors, isDark, scrollBottomPad],
  );

  const showFreeBookingsUsage =
    showFreeTierBookingCount &&
    typeof resolvedFreeBookingUsed === 'number' &&
    !freeTierUsage.isLoading;
  const hasUnreadNotifications = unreadCount > 0;
  const notificationsA11yLabel = hasUnreadNotifications ? 'Notifications, unread' : 'Notifications';

  const warnFreePlanBookingLimitIfNeeded = useCallback(() => {
    const atFreeLimit =
      isOwnerProfileLoaded &&
      !hasProAccess &&
      Boolean(dashboard.business?.id) &&
      !dashboard.businessError &&
      typeof resolvedFreeBookingUsed === 'number' &&
      resolvedFreeBookingUsed >= FREE_TIER_BOOKINGS_LIMIT;

    if (!atFreeLimit) {
      return false;
    }

    const copy = freeTierBookingsLimitCopy(FREE_TIER_BOOKINGS_LIMIT);
    showWebAccountFeatureAlert({
      title: copy.alertTitle,
      message: copy.alertMessage,
    });
    return true;
  }, [
    dashboard.business?.id,
    dashboard.businessError,
    hasProAccess,
    isOwnerProfileLoaded,
    resolvedFreeBookingUsed,
  ]);

  const handleCreateAppointment = useCallback(() => {
    if (warnFreePlanBookingLimitIfNeeded()) {
      return;
    }
    navigation.navigate(ROUTES.CREATE_APPOINTMENT);
  }, [navigation, warnFreePlanBookingLimitIfNeeded]);

  const handleCreateQuote = useCallback(() => {
    if (warnFreePlanBookingLimitIfNeeded()) {
      return;
    }
    navigation.navigate(ROUTES.CREATE_QUOTE);
  }, [navigation, warnFreePlanBookingLimitIfNeeded]);

  const handleOpenNotifications = useCallback(() => {
    navigation.navigate(ROUTES.NOTIFICATIONS_INBOX);
  }, [navigation]);

  const handleNextUpMarkComplete = useCallback(async () => {
    const id = dashboard.nextBooking?.id;
    if (!id) {
      return;
    }
    try {
      await markCompleteMutation.mutateAsync(id);
    } catch (error) {
      Alert.alert(
        'Could not mark complete',
        safeUserFacingMessage(error, { fallback: 'Please try again.' }),
      );
    }
  }, [dashboard.nextBooking?.id, markCompleteMutation]);

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
          <AppText accessibilityRole="header" numberOfLines={1} style={styles.profileName}>
            {businessDisplayName}
          </AppText>
          <Pressable
            accessibilityHint="Opens your notifications"
            accessibilityLabel={notificationsA11yLabel}
            accessibilityRole="button"
            style={styles.bellButton}
            onPress={handleOpenNotifications}
          >
            <View style={styles.bellIconWrap}>
              <Ionicons color={colors.textMuted} name="notifications-outline" size={22} />
              {hasUnreadNotifications ? (
                <View style={[styles.bellBadge, { backgroundColor: colors.notificationBellDot }]} />
              ) : null}
            </View>
          </Pressable>
        </View>
        <View style={styles.headerDivider} />
        {showFreeBookingsUsage ? (
          <HomeFreeBookingsUsageCard
            limit={FREE_TIER_BOOKINGS_LIMIT}
            used={resolvedFreeBookingUsed}
          />
        ) : null}
        {homeErrors.bannerError ? <HomeErrorBanner message={homeErrors.bannerError} /> : null}
        <AppText style={[styles.sectionLabel, styles.sectionLabelFirst]}>
          {nextUpSectionTitle}
        </AppText>
        <NextUpCard
          bookingsError={homeErrors.nextUpBookingsError}
          businessError={homeErrors.nextUpBusinessError}
          businessName={dashboard.business?.business_name?.trim() || undefined}
          isLoading={sectionLoading}
          markCompleteLoading={markCompleteMutation.isPending}
          nextBooking={dashboard.nextBooking}
          onMarkComplete={
            dashboard.spotlightMode === 'in_progress' && dashboard.nextBooking?.id
              ? handleNextUpMarkComplete
              : undefined
          }
          spotlightMode={dashboard.spotlightMode}
          subtitle={dashboard.nextSubtitle}
        />

        <AppText style={styles.sectionLabel}>Link visits</AppText>
        <LinkStatsSection
          businessError={homeErrors.linkBusinessError}
          hasProAccess={hasProAccess}
          isLoading={dashboard.isPendingBusiness}
          isPendingViews={linkViews.isPendingViews}
          lastViewedAt={linkViews.lastViewedAt}
          linkSectionDegraded={homeErrors.linkSectionDegraded}
          effectivePeriod={linkViews.effectivePeriod}
          onPeriodChange={linkViews.onPeriodChange}
          period={linkViews.period}
          slug={slug}
          views={linkViews.views}
          viewsError={linkViews.viewsError}
        />

        {showTodayTimelineSection ? (
          <>
            <AppText style={styles.sectionLabel}>Today&apos;s timeline</AppText>
            <RestOfTodayCard
              error={homeErrors.restOfTodayError}
              isLoading={dashboard.isPendingTodayBookings}
              items={dashboard.todayTimelineItems}
            />
          </>
        ) : null}
      </ScrollView>
      <FloatingCreateMenu
        bottom={30}
        onCreateAppointment={handleCreateAppointment}
        onCreateQuote={handleCreateQuote}
      />
    </SafeAreaView>
  );
}
