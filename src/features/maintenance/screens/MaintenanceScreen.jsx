import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
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
import { useTheme } from '../../../theme';
import { MaintenanceEnrollmentCard } from '../components/MaintenanceEnrollmentCard';
import { MaintenanceHowItWorks } from '../components/MaintenanceHowItWorks';
import {
  MAINTENANCE_LIST_EMPTY_COMPLETED,
  MAINTENANCE_LIST_EMPTY_CONFIRMED,
  MAINTENANCE_LIST_EMPTY_PENDING,
  MAINTENANCE_TAB_COMPLETED,
  MAINTENANCE_TAB_CONFIRMED,
  MAINTENANCE_TAB_OPTIONS,
  MAINTENANCE_TAB_PENDING,
} from '../constants';
import { useMaintenanceInbox } from '../hooks/useMaintenanceInbox';

function MaintenanceListSkeleton() {
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

export function MaintenanceScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const inbox = useMaintenanceInbox();
  const [listTab, setListTab] = useState(MAINTENANCE_TAB_PENDING);

  const openDetail = useCallback(
    (customerId, enrollmentId) => {
      navigation.navigate(ROUTES.MAINTENANCE_DETAIL, { customerId, enrollmentId });
    },
    [navigation],
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
          paddingBottom: 28 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        pills: {
          marginBottom: 12,
        },
        howItWorksBlock: {
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

  const cardsByTab = useMemo(
    () => ({
      [MAINTENANCE_TAB_PENDING]: inbox.pendingCards,
      [MAINTENANCE_TAB_CONFIRMED]: inbox.confirmedCards,
      [MAINTENANCE_TAB_COMPLETED]: inbox.completedCards,
    }),
    [inbox.completedCards, inbox.confirmedCards, inbox.pendingCards],
  );

  const emptyCopyByTab = useMemo(
    () => ({
      [MAINTENANCE_TAB_PENDING]: MAINTENANCE_LIST_EMPTY_PENDING,
      [MAINTENANCE_TAB_CONFIRMED]: MAINTENANCE_LIST_EMPTY_CONFIRMED,
      [MAINTENANCE_TAB_COMPLETED]: MAINTENANCE_LIST_EMPTY_COMPLETED,
    }),
    [],
  );

  const cards = cardsByTab[listTab] ?? [];
  const emptyCopy = emptyCopyByTab[listTab] ?? MAINTENANCE_LIST_EMPTY_PENDING;

  const showBusinessMissing = !inbox.isLoading && !inbox.businessError && !inbox.business?.id;

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            onRefresh={() => void inbox.refetch()}
            refreshing={inbox.isFetching && !inbox.isLoading}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.pills}>
          <FilterPills
            onSelect={setListTab}
            options={MAINTENANCE_TAB_OPTIONS}
            selectedKey={listTab}
          />
        </View>

        <View style={styles.howItWorksBlock}>
          <MaintenanceHowItWorks />
        </View>

        {inbox.businessError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard padding="md">
              <InlineCardError message={inbox.businessError} />
            </SurfaceCard>
          </View>
        ) : null}
        {inbox.listError ? (
          <View style={styles.errorBlock}>
            <SurfaceCard padding="md">
              <InlineCardError message={inbox.listError} />
            </SurfaceCard>
          </View>
        ) : null}

        {inbox.isLoading ? (
          <MaintenanceListSkeleton />
        ) : showBusinessMissing ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>Business profile not found</AppText>
            <AppText style={styles.emptyBody}>
              Finish onboarding on this account so we can load maintenance offers.
            </AppText>
          </View>
        ) : inbox.listError ? null : cards.length === 0 ? (
          <View style={styles.emptyWrap}>
            <AppText style={styles.emptyTitle}>{emptyCopy.title}</AppText>
            <AppText style={styles.emptyBody}>{emptyCopy.body}</AppText>
          </View>
        ) : (
          <View style={styles.list}>
            {cards.map((row) => (
              <MaintenanceEnrollmentCard
                customerName={row.customerName}
                key={row.enrollmentId}
                line={row.line}
                statusLabel={row.statusLabel}
                statusRaw={row.statusRaw}
                onPress={() => openDetail(row.customerId, row.enrollmentId)}
              />
            ))}
          </View>
        )}
      </ScrollView>
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
