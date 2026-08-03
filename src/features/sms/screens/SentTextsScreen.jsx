import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  InlineCardError,
  LoadMoreLink,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { groupRecentNotificationsByDay } from '../../notifications/utils/groupRecentNotificationsByDay';
import { SentTextRow } from '../components/SentTextRow';
import { SentTextsEmptyState } from '../components/SentTextsEmptyState';
import { SentTextsListSkeleton } from '../components/SentTextsListSkeleton';
import { useBusinessSmsMessages } from '../hooks/useBusinessSmsMessages';

/** Outbound customer SMS timeline from `sms_messages`. */
export function SentTextsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);
  const {
    business,
    messages,
    showingDesignPreview,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    loadMore,
    businessError,
    listError,
    refetch,
  } = useBusinessSmsMessages();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const dayBlocks = useMemo(() => groupRecentNotificationsByDay(messages), [messages]);

  const onRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void onRefresh()}
        refreshing={isManualRefreshing}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isManualRefreshing, onRefresh],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        list: {
          flex: 1,
        },
        content: {
          flexGrow: 1,
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 12,
          width: '100%',
        },
        previewBanner: {
          marginBottom: 14,
          paddingHorizontal: 2,
        },
        previewTitle: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.05,
          lineHeight: 18,
        },
        dayBlock: {
          marginBottom: 16,
        },
        sectionHeader: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.15,
          marginBottom: 8,
        },
        sectionCard: {
          overflow: 'hidden',
        },
        errorWrap: {
          gap: 10,
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
      }),
    [colors, scrollBottomPad],
  );

  const showBusinessMissing = !isLoading && !businessError && Boolean(user?.id) && !business?.id;

  if (isLoading) {
    return (
      <View style={styles.root}>
        <View style={styles.content}>
          <SentTextsListSkeleton />
        </View>
      </View>
    );
  }

  if (businessError || listError) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.errorWrap}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <InlineCardError message={businessError || listError} />
          <Button
            accessibilityLabel="Try again"
            fullWidth
            loading={isManualRefreshing}
            title="Try again"
            variant="secondary"
            onPress={() => void onRefresh()}
          />
        </ScrollView>
      </View>
    );
  }

  if (showBusinessMissing) {
    return (
      <View style={styles.root}>
        <SentTextsEmptyState
          detail="Finish setting up your business profile to track customer texts."
          title="No business profile"
        />
      </View>
    );
  }

  if (!showingDesignPreview && messages.length === 0) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          <SentTextsEmptyState />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        contentContainerStyle={styles.content}
        data={dayBlocks}
        keyExtractor={(block) => block.title}
        ListHeaderComponent={
          showingDesignPreview ? (
            <View style={styles.previewBanner}>
              <AppText style={styles.previewTitle}>
                Preview sample texts — real sends will replace these.
              </AppText>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasNextPage ? (
            <LoadMoreLink
              accessibilityHint="Loads older texts sent to customers"
              label="Load older"
              loading={isFetchingNextPage}
              onPress={loadMore}
            />
          ) : null
        }
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        renderItem={({ item: block }) => (
          <View style={styles.dayBlock}>
            <AppText style={styles.sectionHeader}>{block.title}</AppText>
            <SurfaceCard padding="none" style={styles.sectionCard}>
              {block.data.map((row, index) => (
                <SentTextRow
                  key={row.id}
                  item={row}
                  showDividerBelow={index < block.data.length - 1}
                />
              ))}
            </SurfaceCard>
          </View>
        )}
      />
    </View>
  );
}
