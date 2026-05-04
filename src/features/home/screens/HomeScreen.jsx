import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppShellGlow, AppText, Divider } from '../../../components/ui';
import { ROUTES } from '../../../routes/routes';
import { FloatingCreateMenu } from '../components/FloatingCreateMenu';
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

export function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
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
    navigation.navigate(ROUTES.CREATE_APPOINTMENT);
  }, [navigation]);

  const handleCreateQuote = useCallback(() => {
    Alert.alert('Create quote', 'Quote creation flow coming next.');
  }, []);

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
            accessibilityHint="Opens notification settings"
            accessibilityLabel="Notifications"
            accessibilityRole="button"
            style={styles.bellButton}
            onPress={handleOpenNotifications}
          >
            <Ionicons color={colors.textMuted} name="notifications-outline" size={22} />
          </Pressable>
        </View>
        <Divider style={styles.headerDivider} />
        {dashboard.isFetching && !dashboard.isLoading ? (
          <AppText style={[styles.syncHint, { color: colors.textMuted }]}>Updating…</AppText>
        ) : null}
        {homeErrors.bannerError ? <HomeErrorBanner message={homeErrors.bannerError} /> : null}
        <AppText style={[styles.sectionLabel, styles.sectionLabelFirst]}>
          {nextUpSectionTitle}
        </AppText>
        <NextUpCard
          bookingsError={homeErrors.nextUpBookingsError}
          businessError={homeErrors.nextUpBusinessError}
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

        <AppText style={styles.sectionLabel}>Rest of Today</AppText>
        <RestOfTodayCard
          error={homeErrors.restOfTodayError}
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
