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
import { BookingCompleteVisitSheet } from '../../bookings/booking-details/components/BookingCompleteInvoiceDesignSheet';
import { MARK_COMPLETE_SHOW_COMPLETE_VISIT_DESIGN_PREVIEW } from '../../bookings/booking-details/constants/markCompleteFeatureFlags';
import { BookingMarkCompleteSheet } from '../../bookings/booking-details/components/BookingMarkCompleteSheet';
import { useMarkBookingCompleteFlow } from '../../bookings/booking-details/hooks/useMarkBookingCompleteFlow';
import { showWebAccountFeatureAlert, useSubscription } from '../../subscription';
import { FloatingCreateMenu } from '../components/FloatingCreateMenu';
import { HomeFreeBookingsUsageCard } from '../components/HomeFreeBookingsUsageCard';
import { HomeErrorBanner } from '../components/HomeErrorBanner';
import { LinkStatsSection } from '../components/LinkStatsSection';
import { NextUpCard } from '../components/NextUpCard';
import { RestOfTodayCard } from '../components/restOfToday';
import { NEXT_UP_LIFECYCLE_DESIGN_PREVIEW } from '../constants/nextUpDesignFlags';
import { useNextUpLifecycleDesignPreview } from '../hooks/useNextUpLifecycleDesignPreview';
import { useHomeDashboard } from '../hooks/useHomeDashboard';
import { useLinkViewsAnalytics } from '../hooks/useLinkViewsAnalytics';
import { computeHomeErrorPresentation } from '../utils/homeErrorPresentation';
import {
  resolveNextUpCardActionMode,
  resolveNextUpSectionTitle,
  resolveNextUpWorkingPhase,
} from '../utils/resolveNextUpCardActions';
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
  const nextBookingId = dashboard.nextBooking?.id ?? null;
  const markCompleteFlow = useMarkBookingCompleteFlow(nextBookingId, {
    booking: dashboard.nextBooking
      ? {
          id: dashboard.nextBooking.id,
          customer_id: dashboard.nextBooking.customer_id ?? null,
          customer_email: dashboard.nextBooking.customer_email ?? null,
          customer_phone: dashboard.nextBooking.customer_phone ?? null,
          customer_name: dashboard.nextBooking.customer_name ?? null,
        }
      : null,
    businessId: dashboard.business?.id ?? null,
  });
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
  const [invoiceDesignSheetVisible, setInvoiceDesignSheetVisible] = useState(false);
  const lifecycleDesignPreview = useNextUpLifecycleDesignPreview();
  const showCompleteVisitDesignPreview =
    typeof __DEV__ !== 'undefined' && __DEV__ && MARK_COMPLETE_SHOW_COMPLETE_VISIT_DESIGN_PREVIEW;
  const showLifecycleDesignPreview =
    typeof __DEV__ !== 'undefined' && __DEV__ && NEXT_UP_LIFECYCLE_DESIGN_PREVIEW;
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

  const nextUpActionMode = useMemo(() => {
    const booking = lifecycleDesignPreview.isActive
      ? lifecycleDesignPreview.booking
      : dashboard.nextBooking;
    if (!booking) {
      return dashboard.spotlightMode === 'in_progress' ? 'working' : 'upcoming';
    }
    const fromStatus = resolveNextUpCardActionMode(booking.job_status);
    if (fromStatus !== 'upcoming') {
      return fromStatus;
    }
    return dashboard.spotlightMode === 'in_progress' ? 'working' : 'upcoming';
  }, [
    dashboard.nextBooking,
    dashboard.spotlightMode,
    lifecycleDesignPreview.booking,
    lifecycleDesignPreview.isActive,
  ]);

  const nextUpSectionTitle = useMemo(
    () => resolveNextUpSectionTitle(nextUpActionMode),
    [nextUpActionMode],
  );

  /** Show while business exists, or during first business fetch so the timeline skeleton paints with the rest of home. */
  const showTodayTimelineSection =
    Boolean(dashboard.business?.id) || (dashboard.isPendingBusiness && !dashboard.businessError);

  const todayTimelineLoading = dashboard.isPendingBusiness || dashboard.isPendingTodayBookings;

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
        designPreviewRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 12,
        },
        designPreviewBtn: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          paddingHorizontal: 12,
          paddingVertical: 8,
        },
        designPreviewBtnText: {
          color: colors.textSecondary,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        designPreviewBtnActive: {
          backgroundColor: colors.buttonPrimaryBg,
          borderColor: colors.buttonPrimaryBg,
        },
        designPreviewBtnTextActive: {
          color: colors.buttonPrimaryText,
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

  const handleNextUpMarkComplete = useCallback(() => {
    if (lifecycleDesignPreview.isActive) {
      lifecycleDesignPreview.openCompleteSheet();
      return;
    }
    if (!nextBookingId) {
      return;
    }
    markCompleteFlow.openSheet();
  }, [lifecycleDesignPreview, markCompleteFlow, nextBookingId]);

  const effectiveNextBooking = lifecycleDesignPreview.isActive
    ? lifecycleDesignPreview.booking
    : dashboard.nextBooking;
  const effectiveNextSubtitle = lifecycleDesignPreview.isActive
    ? lifecycleDesignPreview.subtitle
    : dashboard.nextSubtitle;
  const effectiveSpotlightMode = lifecycleDesignPreview.isActive
    ? 'upcoming'
    : dashboard.spotlightMode;
  const nextUpWorkingPhase = useMemo(() => {
    if (lifecycleDesignPreview.isActive) {
      return lifecycleDesignPreview.workingPhase;
    }
    if (!dashboard.nextBooking) {
      return 'ready';
    }
    return (
      resolveNextUpWorkingPhase(
        dashboard.nextBooking.job_status,
        dashboard.nextBooking.work_handoff_status,
      ) ?? 'ready'
    );
  }, [dashboard.nextBooking, lifecycleDesignPreview.isActive, lifecycleDesignPreview.workingPhase]);

  const nextUpMarkCompleteEnabled = lifecycleDesignPreview.isActive
    ? lifecycleDesignPreview.workingPhase === 'ready'
    : nextUpActionMode === 'working' && Boolean(nextBookingId) && nextUpWorkingPhase === 'ready';

  const handleConfirmMarkComplete = useCallback(async () => {
    try {
      await markCompleteFlow.confirmComplete();
    } catch (error) {
      Alert.alert(
        'Could not mark complete',
        safeUserFacingMessage(error, { fallback: 'Please try again.' }),
      );
    }
  }, [markCompleteFlow]);

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {markCompleteFlow.useCompleteVisitScreen ? (
        <BookingCompleteVisitSheet
          isLoading={markCompleteFlow.isLoadingPreview}
          loadError={markCompleteFlow.previewError}
          visitModel={markCompleteFlow.completeVisitModel}
          visible={markCompleteFlow.sheetVisible}
          onComplete={handleConfirmMarkComplete}
          onRequestClose={markCompleteFlow.closeSheet}
        />
      ) : (
        <BookingMarkCompleteSheet
          isLoadingPreview={markCompleteFlow.isLoadingPreview}
          isSubmitting={markCompleteFlow.isConfirming}
          preview={markCompleteFlow.preview}
          previewError={markCompleteFlow.previewError}
          visible={markCompleteFlow.sheetVisible}
          onConfirm={() => void handleConfirmMarkComplete()}
          onRequestClose={markCompleteFlow.closeSheet}
        />
      )}
      {lifecycleDesignPreview.isActive ? (
        <BookingCompleteVisitSheet
          visible={lifecycleDesignPreview.completeSheetVisible}
          onRequestClose={lifecycleDesignPreview.closeCompleteSheet}
        />
      ) : null}
      {showCompleteVisitDesignPreview ? (
        <BookingCompleteVisitSheet
          visible={invoiceDesignSheetVisible}
          onRequestClose={() => setInvoiceDesignSheetVisible(false)}
        />
      ) : null}
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
        {showLifecycleDesignPreview || showCompleteVisitDesignPreview ? (
          <View style={styles.designPreviewRow}>
            {showLifecycleDesignPreview ? (
              <>
                <Pressable
                  accessibilityHint="Starts a mock Next Up card at the first job step"
                  accessibilityLabel="Preview job lifecycle"
                  accessibilityRole="button"
                  style={[
                    styles.designPreviewBtn,
                    lifecycleDesignPreview.isActive && styles.designPreviewBtnActive,
                  ]}
                  onPress={() => {
                    if (lifecycleDesignPreview.isActive) {
                      lifecycleDesignPreview.stop();
                      return;
                    }
                    lifecycleDesignPreview.start();
                  }}
                >
                  <AppText
                    style={[
                      styles.designPreviewBtnText,
                      lifecycleDesignPreview.isActive && styles.designPreviewBtnTextActive,
                    ]}
                  >
                    {lifecycleDesignPreview.isActive ? 'Exit job preview' : 'Preview job flow'}
                  </AppText>
                </Pressable>
                {lifecycleDesignPreview.isActive ? (
                  <Pressable
                    accessibilityHint="Restarts the mock job flow from On my way"
                    accessibilityLabel="Reset job preview"
                    accessibilityRole="button"
                    style={styles.designPreviewBtn}
                    onPress={lifecycleDesignPreview.reset}
                  >
                    <AppText style={styles.designPreviewBtnText}>Reset flow</AppText>
                  </Pressable>
                ) : null}
              </>
            ) : null}
            {showCompleteVisitDesignPreview ? (
              <Pressable
                accessibilityHint="Opens a design preview of the complete visit and invoice sheet"
                accessibilityLabel="Preview complete invoice modal"
                accessibilityRole="button"
                style={styles.designPreviewBtn}
                onPress={() => setInvoiceDesignSheetVisible(true)}
              >
                <AppText style={styles.designPreviewBtnText}>Preview complete + invoice</AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
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
          actionHandlers={
            lifecycleDesignPreview.isActive ? lifecycleDesignPreview.actionHandlers : null
          }
          bookingsError={lifecycleDesignPreview.isActive ? null : homeErrors.nextUpBookingsError}
          businessError={lifecycleDesignPreview.isActive ? null : homeErrors.nextUpBusinessError}
          businessId={dashboard.business?.id ?? null}
          isLoading={lifecycleDesignPreview.isActive ? false : sectionLoading}
          markCompleteLoading={
            lifecycleDesignPreview.isActive ? false : markCompleteFlow.isConfirming
          }
          nextBooking={effectiveNextBooking}
          onMarkComplete={nextUpMarkCompleteEnabled ? handleNextUpMarkComplete : undefined}
          onNotifyWorkFinished={
            lifecycleDesignPreview.isActive
              ? lifecycleDesignPreview.requestWorkFinishedNotify
              : undefined
          }
          onSkipWorkNotify={
            lifecycleDesignPreview.isActive ? lifecycleDesignPreview.skipWorkNotify : undefined
          }
          spotlightMode={effectiveSpotlightMode}
          subtitle={effectiveNextSubtitle}
          workingPhase={nextUpWorkingPhase}
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
              isLoading={todayTimelineLoading}
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
