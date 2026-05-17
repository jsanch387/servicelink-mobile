import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppText,
  FilterPills,
  InlineCardError,
  SkeletonBox,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { navigateToUpgradePlan } from '../../subscription/navigation/navigateToUpgradePlan';
import { useTheme } from '../../../theme';
import { navigationRef } from '../../../navigation/navigationRef';
import { useAuth } from '../../auth';
import { useSubscription } from '../../subscription';
import { AddQuoteFab } from '../components/AddQuoteFab';
import { QuoteRequestCard } from '../components/QuoteRequestCard';
import { QuotesAcceptRequestsCard } from '../components/QuotesAcceptRequestsCard';
import { SentQuoteCard } from '../components/SentQuoteCard';
import {
  QUOTE_DETAIL_KIND_REQUEST,
  QUOTE_DETAIL_KIND_SENT,
  QUOTES_TAB_OPTIONS,
  QUOTES_TAB_REQUESTS,
  QUOTES_TAB_SENT,
} from '../constants';
import { useQuotesInbox } from '../hooks/useQuotesInbox';

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
  const [listTab, setListTab] = useState(QUOTES_TAB_REQUESTS);
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

  const onUpgradeToProPress = useCallback(() => {
    navigateToUpgradePlan(navigation);
  }, [navigation]);

  const openRequestDetail = useCallback(
    (quoteId) => {
      navigation.navigate(ROUTES.QUOTE_DETAIL, { kind: QUOTE_DETAIL_KIND_REQUEST, quoteId });
    },
    [navigation],
  );

  const openSentDetail = useCallback(
    (quoteId) => {
      navigation.navigate(ROUTES.QUOTE_DETAIL, { kind: QUOTE_DETAIL_KIND_SENT, quoteId });
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
          paddingTop: 30,
        },
        toggleBlock: {
          marginBottom: 24,
        },
        inboxBlock: {
          marginBottom: 4,
        },
        sectionLabel: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginBottom: 12,
        },
        pills: {
          marginBottom: 16,
        },
        list: {
          gap: 12,
        },
        errorBlock: {
          marginBottom: 16,
        },
        emptyWrap: {
          alignItems: 'center',
          marginTop: 24,
          paddingHorizontal: 8,
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
              onUpgradePress={onUpgradeToProPress}
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

          <View style={styles.inboxBlock}>
            <AppText style={styles.sectionLabel}>Inbox</AppText>
            <View style={styles.pills}>
              <FilterPills
                onSelect={setListTab}
                options={QUOTES_TAB_OPTIONS}
                selectedKey={listTab}
              />
            </View>
          </View>

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
          ) : quotesList.listError ? null : (
            <View style={styles.list}>
              {listTab === QUOTES_TAB_REQUESTS ? (
                quotesList.quoteRequests.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <AppText style={styles.emptyTitle}>No quote requests</AppText>
                    <AppText style={styles.emptyBody}>
                      New customer requests appear here when someone asks for a quote from your
                      booking link or website flow.
                    </AppText>
                  </View>
                ) : (
                  quotesList.quoteRequests.map((row) => (
                    <QuoteRequestCard
                      customerName={row.customerName}
                      key={row.id}
                      receivedLabel={row.receivedLabel}
                      summary={row.summary}
                      onPress={() => openRequestDetail(row.id)}
                    />
                  ))
                )
              ) : listTab === QUOTES_TAB_SENT ? (
                quotesList.quoteSent.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <AppText style={styles.emptyTitle}>No sent quotes yet</AppText>
                    <AppText style={styles.emptyBody}>
                      Drafts and quotes you send live here while you wait on the customer.
                    </AppText>
                  </View>
                ) : (
                  quotesList.quoteSent.map((row) => (
                    <SentQuoteCard
                      customerName={row.customerName}
                      key={row.id}
                      line={row.line}
                      statusLabel={row.statusLabel}
                      statusRaw={row.statusRaw}
                      onPress={() => openSentDetail(row.id)}
                    />
                  ))
                )
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
