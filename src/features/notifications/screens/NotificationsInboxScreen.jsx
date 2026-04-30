import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { NotificationsInboxSkeleton } from '../components/NotificationsInboxSkeleton';
import { useNotificationsInbox } from '../hooks/useNotificationsInbox';

function iconForType(type) {
  if (type === 'payment') return 'card-outline';
  return 'calendar-clear-outline';
}

function NotificationRow({ item, showDivider = true }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        rowPress: {
          borderRadius: 12,
        },
        row: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 2,
          paddingVertical: 12,
        },
        leftIcon: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: 999,
          borderWidth: 1,
          height: 32,
          justifyContent: 'center',
          marginTop: 1,
          width: 32,
        },
        content: {
          flex: 1,
          minWidth: 0,
        },
        topLine: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        title: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '600',
          paddingRight: 8,
        },
        time: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
        },
        body: {
          color: colors.textMuted,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 3,
        },
        unreadDot: {
          backgroundColor: '#10b981',
          borderRadius: 99,
          height: 8,
          marginLeft: 8,
          marginTop: 6,
          width: 8,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          marginTop: 2,
          opacity: 0.7,
        },
      }),
    [colors],
  );

  return (
    <View>
      <Pressable accessibilityRole="button" style={styles.rowPress}>
        {({ pressed }) => (
          <View style={[styles.row, pressed && { backgroundColor: colors.buttonGhostPressed }]}>
            <View style={styles.leftIcon}>
              <Ionicons color={colors.textMuted} name={iconForType(item.type)} size={16} />
            </View>
            <View style={styles.content}>
              <View style={styles.topLine}>
                <AppText style={styles.title}>{item.title}</AppText>
                <AppText style={styles.time}>{item.time}</AppText>
              </View>
              <AppText style={styles.body}>{item.body}</AppText>
            </View>
            {item.unread ? <View style={styles.unreadDot} /> : null}
          </View>
        )}
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

/** Pushed above tabs from Home bell — received notifications (mock data for now). */
export function NotificationsInboxScreen() {
  const { colors } = useTheme();
  const { items, isLoading, isFetching, loadError, refetch } = useNotificationsInbox();

  const unreadCount = useMemo(() => items.filter((n) => n.unread).length, [items]);

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
          paddingBottom: 28,
          paddingHorizontal: 20,
          paddingTop: 16,
        },
        inboxCard: {
          gap: 2,
        },
        inboxTitleRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        inboxTitle: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        unreadChip: {
          backgroundColor: colors.buttonSecondaryBg,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        unreadChipText: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
        },
        markAllButton: {
          marginTop: 8,
        },
        updatingHint: {
          color: colors.textMuted,
          fontSize: 13,
          marginBottom: 8,
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

  if (isLoading) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <NotificationsInboxSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (loadError) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          <InlineCardError message={loadError} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {isFetching && !isLoading ? <AppText style={styles.updatingHint}>Updating…</AppText> : null}
        <SurfaceCard style={styles.inboxCard}>
          <View style={styles.inboxTitleRow}>
            <AppText style={styles.inboxTitle}>Recent activity</AppText>
            <View style={styles.unreadChip}>
              <AppText style={styles.unreadChipText}>{`${unreadCount} unread`}</AppText>
            </View>
          </View>

          {items.map((item, idx) => (
            <NotificationRow key={item.id} item={item} showDivider={idx < items.length - 1} />
          ))}

          <Button
            fullWidth
            style={styles.markAllButton}
            title="Mark all as read"
            variant="secondary"
            onPress={() => {}}
          />
        </SurfaceCard>
      </ScrollView>
    </View>
  );
}
