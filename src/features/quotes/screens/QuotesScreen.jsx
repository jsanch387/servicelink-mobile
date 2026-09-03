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
  QUOTES_FILTER_OPTIONS,
  QUOTES_FILTER_REQUEST,
  QUOTES_FILTER_SENT,
} from '../constants';
import { useQuotesInbox } from '../hooks/useQuotesInbox';
import { groupApprovedQuotesByMonth } from '../utils/groupApprovedQuotesByMonth';

const FILTER_EMPTY_COPY = {
  [QUOTES_FILTER_REQUEST]: {
    title: 'No quote requests',
    body: 'New requests and unfinished drafts will appear here.',
  },
  [QUOTES_FILTER_SENT]: {
    title: 'No sent quotes',
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
        <SurfaceCard key={k} padding="none" style={skeletonStyles.card}>
          <SkeletonBox borderRadius={8} height={18} pulse width="46%" />
          <SkeletonBox
            borderRadius={8}
            height={13}
            pulse
            style={skeletonStyles.lineGap}
            width="64%"
          />
          <SkeletonBox
            borderRadius={8}
            height={13}
            pulse
            style={skeletonStyles.footerGap}
            width="32%"
          />
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
  const [activeFilter, setActiveFilter] = useState(QUOTES_FILTER_REQUEST);
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
      confirmText: quotesAcceptRequestsAccessCopy.inlineAction,
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
          paddingTop: 16,
        },
        toggleBlock: {
          marginBottom: 20,
        },
        toggleBlockSolo: {
          marginBottom: 0,
        },
        pills: {
          marginBottom: 14,
        },
        list: {
          gap: 10,
        },
        monthGroup: {
          gap: 10,
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
  const showQuotesInbox = isOwnerProfileLoaded && hasProAccess;
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
  const hasNoQuotes = quotesList.totalQuotesCount === 0;
  const activeEmptyCopy = FILTER_EMPTY_COPY[activeFilter];
  const renderQuoteCard = (row) => (
    <QuoteInboxCard
      customerName={row.customerName}
      key={row.id}
      serviceLabel={row.serviceLabel}
      statusLabel={row.statusLabel}
      statusRaw={row.statusRaw}
      timingLabel={row.timingLabel}
      variant={row.kind === QUOTE_DETAIL_KIND_REQUEST ? 'request' : 'sent'}
      vehicleExtraLabel={row.vehicleExtraLabel}
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
          <View style={[styles.toggleBlock, !showQuotesInbox && styles.toggleBlockSolo]}>
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
          {showQuotesInbox && quotesList.acceptQuoteRequestsError ? (
            <View style={styles.errorBlock}>
              <SurfaceCard padding="md">
                <InlineCardError message={quotesList.acceptQuoteRequestsError} />
              </SurfaceCard>
            </View>
          ) : null}

          {showQuotesInbox ? (
            <>
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
            </>
          ) : null}
        </ScrollView>

        {showQuotesInbox ? <AddQuoteFab bottom={30} onPress={handleCreateQuote} /> : null}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  lineGap: {
    marginTop: 8,
  },
  footerGap: {
    marginTop: 24,
  },
});
