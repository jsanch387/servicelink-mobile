import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, InlineCardError, SurfaceCard } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMembersEmptyState } from './TeamMembersEmptyState';
import { TeamMembersSkeleton } from './TeamMembersSkeleton';

/**
 * Team member cards. Invite FAB + member details live on TeamScreen.
 */
export function TeamMembersPanel({
  members,
  isLoading = false,
  isRefreshing = false,
  error = null,
  onAdd,
  onPressMember,
  onRefresh,
  onRetry,
}) {
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollBottomPad = 28 + Math.max(tabBarHeight, 72);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
        },
        content: {
          gap: 10,
          paddingBottom: scrollBottomPad,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        emptyCard: {
          paddingHorizontal: 20,
          paddingVertical: 28,
        },
        retry: {
          marginTop: 4,
        },
      }),
    [scrollBottomPad],
  );

  let body = null;
  if (isLoading) {
    body = <TeamMembersSkeleton />;
  } else if (error) {
    body = (
      <SurfaceCard padding="none">
        <View style={styles.emptyCard}>
          <InlineCardError message={error} />
          {onRetry ? (
            <View style={styles.retry}>
              <Button fullWidth title="Try again" variant="secondary" onPress={onRetry} />
            </View>
          ) : null}
        </View>
      </SurfaceCard>
    );
  } else if (members.length === 0) {
    body = <TeamMembersEmptyState onAdd={onAdd} />;
  } else {
    body = members.map((member) => (
      <TeamMemberCard key={member.id} member={member} onPress={onPressMember} />
    ));
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              tintColor={colors.accent}
              onRefresh={onRefresh}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {body}
      </ScrollView>
    </View>
  );
}
