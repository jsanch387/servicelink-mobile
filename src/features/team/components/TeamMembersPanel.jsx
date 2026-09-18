import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  EchoBarsLoader,
  InlineCardError,
  SurfaceCard,
} from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { TEAM_MEMBERS_LOADING } from '../constants/teamMembersCopy';
import { TeamMemberCard } from './TeamMemberCard';
import { TeamMembersEmptyState } from './TeamMembersEmptyState';

/**
 * Team member cards. Invite FAB + remove confirm live on TeamScreen.
 */
export function TeamMembersPanel({
  members,
  isLoading = false,
  isRefreshing = false,
  error = null,
  onAdd,
  onRemove,
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
        contentFill: {
          flexGrow: 1,
        },
        loading: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingVertical: 48,
        },
        loadingLabel: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          marginTop: 16,
        },
        emptyCard: {
          paddingHorizontal: 20,
          paddingVertical: 28,
        },
        retry: {
          marginTop: 4,
        },
      }),
    [colors, scrollBottomPad],
  );

  let body = null;
  if (isLoading) {
    body = (
      <View accessibilityLabel={TEAM_MEMBERS_LOADING} style={styles.loading}>
        <EchoBarsLoader size="large" />
        <AppText style={styles.loadingLabel}>{TEAM_MEMBERS_LOADING}</AppText>
      </View>
    );
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
      <TeamMemberCard key={member.id} member={member} onRemove={onRemove} />
    ));
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, isLoading && styles.contentFill]}
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
