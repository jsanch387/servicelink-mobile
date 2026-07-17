import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  FilterPills,
  InlineCardError,
  LoadMoreLink,
  SkeletonBox,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { showWebAccountFeatureAlert, useSubscription } from '../../subscription';
import { quotesAcceptRequestsAccessCopy } from '../constants/quotesAccessCopy';
import { useTheme } from '../../../theme';
import { navigationRef } from '../../../navigation/navigationRef';
import { useAuth } from '../../auth';
import { AddQuoteFab } from '../components/AddQuoteFab';
import { QuoteInboxCard } from '../components/QuoteInboxCard';
import { QuotesAcceptRequestsCard } from '../components/QuotesAcceptRequestsCard';
import { QuotesHowItWorks } from '../components/QuotesHowItWorks';
import {
  QUOTE_DETAIL_KIND_REQUEST,
  QUOTES_FILTER_APPROVED,
  QUOTES_FILTER_NEEDS_ACTION,
  QUOTES_FILTER_OPTIONS,
  QUOTES_FILTER_WAITING,
} from '../constants';
import { useQuotesInbox } from '../hooks/useQuotesInbox';
import { groupApprovedQuotesByMonth } from '../utils/groupApprovedQuotesByMonth';

const FILTER_EMPTY_COPY = {
  [QUOTES_FILTER_NEEDS_ACTION]: {
    title: 'Nothing needs attention',
    body: 'New requests and unfinished drafts will appear here.',
  },
  [QUOTES_FILTER_WAITING]: {
    title: 'No quotes awaiting a reply',
    body: 'Quotes you send appear here while you wait for the customer.',
  },
  [QUOTES_FILTER_APPROVED]: {
    title: 'No approved quotes',
    body: 'Quotes customers accept will appear here.',
  },
};

function QuotesListSkeleton() {
  return (
    <View style={skeletonStyles.column}>
      {[0, 1, 2].map((k) => (
        <SurfaceCard key={k} padding="md" style={skeletonStyles.card}>
          <SkeletonBox borderRadius={8} height={18} pulse width="58%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 12 }} width="36%" />
          <SkeletonBox borderRadius={8} height={14} pulse style={{ marginTop: 14 }} width="72%" />
        </SurfaceCard>
      ))}
    </View>
  );
}

export function QuotesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const userId = user?.id;
  const { hasProAccess, isOwnerProfileLoaded } = useSubscription();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const quotesList = useQuotesInbox();
  const [activeFilter, setActiveFilter] = useState(QUOTES_FILTER_NEEDS_ACTION);
  const [visibleApprovedMonthCount, setVisibleApprovedMonthCount] = useState(1);
  /** Root stack can show Create quote (etc.) above tabs; this scene may stay mounted and steal touches from the native header. */
  const [rootTopRoute, setRootTopRoute] = useState(undefined);

  useEffect(() => {
    const sync = () => {
      if (!navigationRef.isReady()) {
        setRootTopRoute(undefined);
        return;
      }
      const s = navigationRef.getRootState();
      setRootTopRoute(s?.routes?.[s.index]?.name);
    };
    sync();
    return navigationRef.addListener('state', sync);
  }, []);

  const handleAcceptQuoteRequestsChange = useCallback(
    (next) => {
      if (!hasProAccess) {
        return;
      }
      void quotesList.persistAcceptQuoteRequests(next);
    },
    [hasProAccess, quotesList],
  );

  const onWebSignInPress = useCallback(() => {
    showWebAccountFeatureAlert({
      title: quotesAcceptRequestsAccessCopy.alertTitle,
      message: quotesAcceptRequestsAccessCopy.alertMessage,
    });
  }, []);

  const openQuoteDetail = useCallback(
    (quoteId, kind) => {
      navigation.navigate(ROUTES.QUOTE_DETAIL, { kind, quoteId });
    },
    [navigation],
  );

  const handleCreateQuote = useCallback(() => {
    navigation.navigate(ROUTES.CREATE_QUOTE);
  }, [navigation]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        body: {
          flex: 1,
          position: 'relative',
        },
        scroll: {
          flex: 1,
        },
        content: {
          paddingBottom: 28 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 20,
        },
        toggleBlock: {
          marginBottom: 20,
        },
        sectionHeader: {
          marginBottom: 14,
        },
        sectionLabel: {
          color: colors.text,
          fontSize: 18,
          fontWeight: '700',
          letterSpacing: -0.3,
        },
        sectionCaption: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 3,
        },
        pills: {
          marginBottom: 16,
        },
        list: {
          gap: 12,
        },
        monthGroup: {
          gap: 12,
        },
        monthLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '700',
          letterSpacing: 0.1,
          marginBottom: 2,
        },
        errorBlock: {
          marginBottom: 16,
        },
        emptyWrap: {
          alignItems: 'center',
          marginTop: 24,
          paddingHorizontal: 8,
        },
        emptyCenteredWrap: {
          marginTop: 56,
        },
        emptyTitle: {
          color: colors.textSecondary,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 21,
          marginTop: 8,
          textAlign: 'center',
        },
        emptyHelp: {
          alignItems: 'center',
          marginTop: 12,
        },
      }),
    [colors, tabBarHeight],
  );

  const showBusinessMissing =
    !quotesList.isLoading &&
    !quotesList.businessError &&
    Boolean(userId) &&
    !quotesList.business?.id;

  const rootOverlayCoversTabs = rootTopRoute !== undefined && rootTopRoute !== ROUTES.MAIN_APP;

  const proLocked = Boolean(userId) && isOwnerProfileLoaded && !hasProAccess;
  const filterQuotes = quotesList.quoteGroups[activeFilter] ?? [];
  const approvedMonthGroups = useMemo(
    () => groupApprovedQuotesByMonth(quotesList.quoteGroups[QUOTES_FILTER_APPROVED] ?? []),
    [quotesList.quoteGroups],
  );
  const approvedMonthKeys = approvedMonthGroups.map((group) => group.key).join('|');

  useEffect(() => {
    setVisibleApprovedMonthCount(1);
  }, [approvedMonthKeys]);

  const visibleApprovedMonthGroups = approvedMonthGroups.slice(0, visibleApprovedMonthCount);
  const activeQuotes =
    activeFilter === QUOTES_FILTER_APPROVED
      ? visibleApprovedMonthGroups.flatMap((group) => group.cards)
      : filterQuotes;
  const nextApprovedMonth =
    activeFilter === QUOTES_FILTER_APPROVED
      ? (approvedMonthGroups[visibleApprovedMonthCount] ?? null)
      : null;
  const activeCount = filterQuotes.length;
  const hasNoQuotes = quotesList.totalQuotesCount === 0;
  const sectionCaption = useMemo(() => {
    if (activeCount === 0) return null;
    if (activeFilter === QUOTES_FILTER_NEEDS_ACTION) {
      return activeCount === 1 ? '1 quote needs attention' : `${activeCount} quotes need attention`;
    }
    if (activeFilter === QUOTES_FILTER_WAITING) {
      return activeCount === 1
        ? '1 quote awaiting a response'
        : `${activeCount} quotes awaiting a response`;
    }
    return activeCount === 1 ? '1 approved quote' : `${activeCount} approved quotes`;
  }, [activeCount, activeFilter]);
  const activeEmptyCopy = FILTER_EMPTY_COPY[activeFilter];
  const renderQuoteCard = (row) => (
    <QuoteInboxCard
      customerName={row.customerName}
      key={row.id}
      summary={row.summary}
      statusLabel={row.statusLabel}
      statusRaw={row.statusRaw}
      timestampLabel={row.timestampLabel}
      title={row.title}
      variant={row.kind === QUOTE_DETAIL_KIND_REQUEST ? 'request' : 'sent'}
      vehicleLabel={row.vehicleLabel}
      onPress={() => openQuoteDetail(row.id, row.kind)}
    />
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <View pointerEvents={rootOverlayCoversTabs ? 'none' : 'auto'} style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              colors={[colors.accent]}
              onRefresh={quotesList.refetch}
              refreshing={quotesList.isFetching && !quotesList.isLoading}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <View style={styles.toggleBlock}>
            <QuotesAcceptRequestsCard
              disabled={
                !quotesList.business?.id ||
                quotesList.isPendingBusiness ||
                quotesList.acceptQuoteRequestsSaving ||
                !isOwnerProfileLoaded
              }
              proLocked={proLocked}
              value={hasProAccess ? quotesList.acceptQuoteRequests : false}
              onWebSignInPress={onWebSignInPress}
              onValueChange={handleAcceptQuoteRequestsChange}
            />
          </View>
          {quotesList.acceptQuoteRequestsError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard padding="md">
                <InlineCardError message={quotesList.acceptQuoteRequestsError} />
              </SurfaceCard>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionLabel}>Your quotes</AppText>
            {sectionCaption ? (
              <AppText style={styles.sectionCaption}>{sectionCaption}</AppText>
            ) : null}
          </View>
          {!hasNoQuotes || quotesList.isLoading ? (
            <View style={styles.pills}>
              <FilterPills
                onSelect={setActiveFilter}
                options={QUOTES_FILTER_OPTIONS}
                selectedKey={activeFilter}
              />
            </View>
          ) : null}

          {quotesList.businessError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard padding="md">
                <InlineCardError message={quotesList.businessError} />
              </SurfaceCard>
            </View>
          ) : null}
          {quotesList.listError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard padding="md">
                <InlineCardError message={quotesList.listError} />
              </SurfaceCard>
            </View>
          ) : null}

          {quotesList.isLoading ? (
            <QuotesListSkeleton />
          ) : showBusinessMissing ? (
            <View style={styles.emptyWrap}>
              <AppText style={styles.emptyTitle}>Business profile not found</AppText>
              <AppText style={styles.emptyBody}>
                Finish onboarding on this account so we can load quotes for your business.
              </AppText>
            </View>
          ) : quotesList.listError ? null : hasNoQuotes ? (
            <View style={[styles.emptyWrap, styles.emptyCenteredWrap]}>
              <AppText style={styles.emptyTitle}>No quotes yet</AppText>
              <AppText style={styles.emptyBody}>
                Create a quote or accept customer requests.
              </AppText>
              <View style={styles.emptyHelp}>
                <QuotesHowItWorks />
              </View>
            </View>
          ) : (
            <View style={styles.list}>
              {activeQuotes.length === 0 ? (
                <View style={[styles.emptyWrap, styles.emptyCenteredWrap]}>
                  <AppText style={styles.emptyTitle}>{activeEmptyCopy.title}</AppText>
                  <AppText style={styles.emptyBody}>{activeEmptyCopy.body}</AppText>
                </View>
              ) : null}
              {activeFilter === QUOTES_FILTER_APPROVED
                ? visibleApprovedMonthGroups.map((group) => (
                    <View key={group.key} style={styles.monthGroup}>
                      <AppText style={styles.monthLabel}>{group.label}</AppText>
                      {group.cards.map(renderQuoteCard)}
                    </View>
                  ))
                : activeQuotes.map(renderQuoteCard)}
              {nextApprovedMonth ? (
                <LoadMoreLink
                  accessibilityHint="Shows approved quotes from the next older month"
                  label={`Load ${nextApprovedMonth.label}`}
                  onPress={() => setVisibleApprovedMonthCount((count) => count + 1)}
                />
              ) : null}
            </View>
          )}
        </ScrollView>

        <AddQuoteFab bottom={30} onPress={handleCreateQuote} />
      </View>
    </SafeAreaView>
  );
}

const skeletonStyles = StyleSheet.create({
  column: {
    gap: 12,
  },
  card: {
    marginBottom: 0,
  },
});
