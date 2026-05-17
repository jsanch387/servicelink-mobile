import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Divider } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { navigateToUpgradePlan } from '../../subscription/navigation/navigateToUpgradePlan';
import { FloatingCreateMenu } from '../components/FloatingCreateMenu';
import { HomeProUpgradeNudge } from '../components/HomeProUpgradeNudge';
import { HomeErrorBanner } from '../components/HomeErrorBanner';
import { LinkStatsSection } from '../components/LinkStatsSection';
import { NextUpCard } from '../components/NextUpCard';
import { RestOfTodayCard } from '../components/restOfToday';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useHomeQuickMarkComplete } from '../hooks/useHomeQuickMarkComplete';
import { computeHomeErrorPresentation } from '../utils/homeErrorPresentation';
import { normalizeBusinessSlug } from '../utils/bookingLink';
import { useTheme } from '../../../theme';
import { serviceCardTitleStyle } from '../../../utils/serviceCardTypography';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useNotificationUnreadCount } from '../../notifications/hooks/useNotificationUnreadCount';
import { FREE_TIER_BOOKINGS_LIMIT } from '../../bookings/constants';
import { useBookingsFreeTierUsage } from '../../bookings/hooks/useBookingsFreeTierUsage';
import { bookingsFreeTierCountQueryKey } from '../../bookings/queryKeys';
import { resolveFreeTierBookingUsed } from '../../bookings/utils/resolveFreeTierBookingUsed';
import { useSubscription } from '../../subscription';

export function HomeScreen() {
  const { colors } = useTheme();
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

  const atFreeBookingLimit =
    showFreeTierBookingCount &&
    typeof resolvedFreeBookingUsed === 'number' &&
    resolvedFreeBookingUsed >= FREE_TIER_BOOKINGS_LIMIT;

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
          marginBottom: 10,
          marginTop: 6,
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
        headerDivider: {
          marginBottom: 8,
        },
      }),
    [colors, scrollBottomPad],
  );

  const showProUpgradeNudge = isOwnerProfileLoaded && !hasProAccess;
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

    Alert.alert(
      'Free plan limit reached',
      `You've used all ${FREE_TIER_BOOKINGS_LIMIT} appointments on the free plan. Upgrade to Pro for unlimited bookings.`,
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => navigateToUpgradePlan(navigation),
        },
      ],
    );
    return true;
  }, [
    dashboard.business?.id,
    dashboard.businessError,
    hasProAccess,
    isOwnerProfileLoaded,
    navigation,
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

  const handleProUpgradeNudge = useCallback(() => {
    navigateToUpgradePlan(navigation);
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
        <Divider style={styles.headerDivider} />
        {showProUpgradeNudge ? (
          <HomeProUpgradeNudge
            capLimit={FREE_TIER_BOOKINGS_LIMIT}
            capUsed={
              typeof resolvedFreeBookingUsed === 'number' ? resolvedFreeBookingUsed : undefined
            }
            mode={atFreeBookingLimit ? 'free_booking_cap' : 'default'}
            onPress={handleProUpgradeNudge}
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

        <AppText style={styles.sectionLabel}>Booking link</AppText>
        <LinkStatsSection
          businessError={homeErrors.linkBusinessError}
          isLoading={dashboard.isPendingBusiness}
          linkSectionDegraded={homeErrors.linkSectionDegraded}
          profileViews={profileViews}
          slug={slug}
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
