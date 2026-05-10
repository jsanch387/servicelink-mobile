import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  View,
} from 'react-native';
import { AppText, Button, InlineCardError } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { useAuth } from '../../auth';
import { useNotificationUnreadCount } from '../hooks/useNotificationUnreadCount';
import { markAllNotificationsRead } from '../api/markAllNotificationsRead';
import { markNotificationRead } from '../api/markNotificationRead';
import { NotificationsInboxSkeleton } from '../components/NotificationsInboxSkeleton';
import { useNotificationsInbox } from '../hooks/useNotificationsInbox';
import { groupRecentNotificationsByDay } from '../utils/groupRecentNotificationsByDay';
import { openNotificationTarget } from '../utils/openNotificationTarget';

const INBOX_ICON_SIZE = 44;
const INBOX_ICON_GAP = 14;
const INBOX_TEXT_INSET = INBOX_ICON_SIZE + INBOX_ICON_GAP;

function iconForNotificationType(type) {
  if (type === 'payment') return 'card-outline';
  if (type === 'quote') return 'document-text-outline';
  return 'calendar-outline';
}

function NotificationRow({ item, isMarking, onPress, showDivider }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rowPress: {
          borderRadius: 0,
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: INBOX_ICON_GAP,
          paddingVertical: 12,
        },
        iconWrap: {
          alignItems: 'center',
          height: INBOX_ICON_SIZE,
          justifyContent: 'center',
          marginTop: 2,
          position: 'relative',
          width: INBOX_ICON_SIZE,
        },
        leftIcon: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: INBOX_ICON_SIZE / 2,
          borderWidth: StyleSheet.hairlineWidth,
          height: INBOX_ICON_SIZE,
          justifyContent: 'center',
          width: INBOX_ICON_SIZE,
        },
        unreadBadge: {
          borderColor: colors.shell,
          borderRadius: 99,
          borderWidth: 2,
          height: 11,
          position: 'absolute',
          right: 1,
          top: 1,
          width: 11,
        },
        content: {
          flex: 1,
          minWidth: 0,
          paddingTop: 1,
        },
        titleRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 10,
        },
        title: {
          color: colors.text,
          flex: 1,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 16,
          letterSpacing: -0.25,
          lineHeight: 21,
        },
        time: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          letterSpacing: -0.1,
          marginTop: 1,
          minWidth: 40,
          textAlign: 'right',
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          letterSpacing: -0.1,
          lineHeight: 19,
          marginTop: 4,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginLeft: INBOX_TEXT_INSET,
          opacity: 0.85,
        },
      }),
    [colors],
  );

  const headline = item.displayTitle ?? item.title;
  const sub = item.subtitle?.trim() ?? '';
  const a11yLabel = [headline, sub, item.time].filter(Boolean).join('. ');

  return (
    <View>
      <Pressable
        accessibilityHint={item.unread ? 'Marks as read and opens details' : 'Opens related screen'}
        accessibilityLabel={a11yLabel}
        accessibilityRole="button"
        disabled={isMarking}
        style={styles.rowPress}
        onPress={() => onPress(item)}
      >
        {({ pressed }) => (
          <View style={[styles.row, pressed && { backgroundColor: colors.buttonGhostPressed }]}>
            <View style={styles.iconWrap}>
              <View style={styles.leftIcon}>
                <Ionicons
                  color={colors.textMuted}
                  name={iconForNotificationType(item.type)}
                  size={22}
                />
              </View>
              {item.unread ? (
                <View
                  style={[styles.unreadBadge, { backgroundColor: colors.notificationBellDot }]}
                />
              ) : null}
            </View>
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <AppText numberOfLines={2} style={styles.title}>
                  {headline}
                </AppText>
                <AppText style={styles.time}>{item.time}</AppText>
              </View>
              {sub ? (
                <AppText numberOfLines={2} style={styles.subtitle}>
                  {sub}
                </AppText>
              ) : null}
            </View>
          </View>
        )}
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

function InboxSegment({ activeScope, onSelect }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 8,
          marginBottom: 4,
        },
        pill: {
          borderRadius: 999,
          flex: 1,
          paddingVertical: 10,
        },
        pillIdle: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.cardBorder,
          borderWidth: StyleSheet.hairlineWidth,
        },
        pillActive: {
          backgroundColor: colors.buttonSecondaryBg,
          borderColor: colors.borderStrong,
          borderWidth: StyleSheet.hairlineWidth,
        },
        pillLabel: {
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
          letterSpacing: -0.1,
          textAlign: 'center',
        },
        labelActive: {
          color: colors.text,
        },
        labelIdle: {
          color: colors.textMuted,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeScope === 'unread' }}
        style={[styles.pill, activeScope === 'unread' ? styles.pillActive : styles.pillIdle]}
        onPress={() => onSelect('unread')}
      >
        <AppText
          style={[
            styles.pillLabel,
            activeScope === 'unread' ? styles.labelActive : styles.labelIdle,
          ]}
        >
          New
        </AppText>
      </Pressable>
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: activeScope === 'recent' }}
        style={[styles.pill, activeScope === 'recent' ? styles.pillActive : styles.pillIdle]}
        onPress={() => onSelect('recent')}
      >
        <AppText
          style={[
            styles.pillLabel,
            activeScope === 'recent' ? styles.labelActive : styles.labelIdle,
          ]}
        >
          Recent
        </AppText>
      </Pressable>
    </View>
  );
}

/** In-app notification feed: unread-first “New”, paginated “Recent”, tap row to mark read. */
export function NotificationsInboxScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState(/** @type {'unread' | 'recent'} */ ('unread'));
  const { unreadCount } = useNotificationUnreadCount();
  const {
    items,
    isLoading,
    isFetching,
    loadError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotificationsInbox(scope);

  const markAllMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        return;
      }
      await markAllNotificationsRead(user.id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const openNotificationMutation = useMutation({
    mutationFn: async (/** @type {{ id: string; unread: boolean }} */ item) => {
      if (user?.id && item.unread) {
        await markNotificationRead(user.id, item.id);
      }
      return item;
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      openNotificationTarget(navigation, item);
    },
    onError: (error) => {
      Alert.alert(
        'Could not update',
        safeUserFacingMessage(error, { fallback: 'Please try again.' }),
      );
    },
  });

  const handleMarkAllRead = useCallback(() => {
    if (!user?.id || unreadCount === 0) {
      return;
    }
    markAllMutation.mutate(undefined, {
      onError: (error) => {
        Alert.alert(
          'Could not mark as read',
          safeUserFacingMessage(error, { fallback: 'Please try again.' }),
        );
      },
    });
  }, [markAllMutation, unreadCount, user?.id]);

  const handleRowPress = useCallback(
    (item) => {
      openNotificationMutation.mutate(item);
    },
    [openNotificationMutation],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        listContent: {
          flexGrow: 1,
          paddingBottom: 32,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 8,
        },
        headerBlock: {
          marginBottom: 8,
        },
        actionsRow: {
          alignItems: 'flex-end',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          marginBottom: 4,
          minHeight: 36,
        },
        markAllText: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 14,
        },
        markAllTextDisabled: {
          opacity: 0.35,
        },
        emptyTitle: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          letterSpacing: -0.2,
          marginBottom: 8,
          textAlign: 'center',
        },
        emptyBody: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          textAlign: 'center',
        },
        emptyWrap: {
          paddingHorizontal: 12,
          paddingTop: 48,
        },
        footerPad: {
          paddingTop: 12,
        },
        errorRetryWrap: {
          marginTop: 14,
        },
        sectionHeader: {
          backgroundColor: colors.shell,
          paddingBottom: 6,
          paddingTop: 14,
        },
        sectionHeaderFirst: {
          paddingTop: 4,
        },
        sectionHeaderLabel: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
        },
      }),
    [colors],
  );

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={refetch}
        refreshing={Boolean(isFetching && !isLoading)}
        tintColor={colors.accent}
      />
    ),
    [colors.accent, isFetching, isLoading, refetch],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.headerBlock}>
        <InboxSegment activeScope={scope} onSelect={setScope} />
        <View style={styles.actionsRow}>
          <Pressable
            accessibilityHint="Marks every notification as read"
            accessibilityLabel="Mark all as read"
            accessibilityRole="button"
            accessibilityState={{ disabled: unreadCount === 0 || markAllMutation.isPending }}
            disabled={unreadCount === 0 || markAllMutation.isPending}
            hitSlop={12}
            onPress={handleMarkAllRead}
          >
            <AppText
              style={[
                styles.markAllText,
                (unreadCount === 0 || markAllMutation.isPending) && styles.markAllTextDisabled,
              ]}
            >
              {markAllMutation.isPending ? 'Marking…' : 'Mark all read'}
            </AppText>
          </Pressable>
        </View>
      </View>
    ),
    [
      handleMarkAllRead,
      markAllMutation.isPending,
      scope,
      styles.actionsRow,
      styles.headerBlock,
      styles.markAllText,
      styles.markAllTextDisabled,
      unreadCount,
    ],
  );

  const emptyCopy = useMemo(() => {
    if (scope === 'unread') {
      return {
        title: 'All caught up',
        body: 'When something new needs your attention, it will show up here.',
      };
    }
    return {
      title: 'No activity yet',
      body: 'When you receive notifications, the most recent ones will appear here.',
    };
  }, [scope]);

  const listEmpty = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <AppText style={styles.emptyTitle}>{emptyCopy.title}</AppText>
        <AppText style={styles.emptyBody}>{emptyCopy.body}</AppText>
      </View>
    ),
    [emptyCopy.body, emptyCopy.title, styles.emptyBody, styles.emptyTitle, styles.emptyWrap],
  );

  const listFooter = useMemo(() => {
    if (scope !== 'recent' || !hasNextPage) {
      return <View style={{ height: 8 }} />;
    }
    return (
      <View style={styles.footerPad}>
        <Button
          fullWidth
          loading={isFetchingNextPage}
          title="Load more"
          variant="secondary"
          onPress={() => void fetchNextPage()}
        />
      </View>
    );
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, scope, styles.footerPad]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <NotificationRow
        isMarking={
          openNotificationMutation.isPending && openNotificationMutation.variables?.id === item.id
        }
        item={item}
        showDivider={index < items.length - 1}
        onPress={handleRowPress}
      />
    ),
    [
      handleRowPress,
      items.length,
      openNotificationMutation.isPending,
      openNotificationMutation.variables,
    ],
  );

  const recentSections = useMemo(() => groupRecentNotificationsByDay(items), [items]);

  const renderRecentItem = useCallback(
    ({ item, index, section }) => (
      <NotificationRow
        isMarking={
          openNotificationMutation.isPending && openNotificationMutation.variables?.id === item.id
        }
        item={item}
        showDivider={index < section.data.length - 1}
        onPress={handleRowPress}
      />
    ),
    [handleRowPress, openNotificationMutation.isPending, openNotificationMutation.variables],
  );

  const renderRecentSectionHeader = useCallback(
    ({ section }) => {
      const isFirst = recentSections[0]?.title === section.title;
      return (
        <View
          accessibilityRole="header"
          style={[styles.sectionHeader, isFirst && styles.sectionHeaderFirst]}
        >
          <AppText style={styles.sectionHeaderLabel}>{section.title}</AppText>
        </View>
      );
    },
    [recentSections, styles.sectionHeader, styles.sectionHeaderFirst, styles.sectionHeaderLabel],
  );

  const recentUsesDaySections = scope === 'recent' && items.length > 0;

  if (isLoading) {
    return (
      <View style={styles.root}>
        <NotificationsInboxSkeleton />
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {listHeader}
          <InlineCardError message={loadError} />
          <View style={styles.errorRetryWrap}>
            <Button
              accessibilityHint="Attempts to load notifications again"
              accessibilityLabel="Try again"
              fullWidth
              loading={isFetching}
              title="Try again"
              variant="secondary"
              onPress={() => void refetch()}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  const listContentStyle =
    items.length === 0 ? [styles.listContent, { flexGrow: 1 }] : styles.listContent;

  if (recentUsesDaySections) {
    return (
      <View style={styles.root}>
        <SectionList
          contentContainerStyle={listContentStyle}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(row) => row.id}
          ListFooterComponent={listFooter}
          ListHeaderComponent={listHeader}
          refreshControl={refreshControl}
          renderItem={renderRecentItem}
          renderSectionHeader={renderRecentSectionHeader}
          sections={recentSections}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        contentContainerStyle={listContentStyle}
        data={items}
        keyExtractor={(row) => row.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        refreshControl={refreshControl}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
