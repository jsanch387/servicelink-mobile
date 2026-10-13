import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { AddTeamMemberFab } from '../components/AddTeamMemberFab';
import { InviteTeamMemberSheet } from '../components/InviteTeamMemberSheet';
import { TeamMembersPanel } from '../components/TeamMembersPanel';
import { TeamMembersSkeleton } from '../components/TeamMembersSkeleton';
import { TeamPlanCta } from '../components/TeamPlanCta';
import { TEAM_INVITE_DESIGN_PREVIEW } from '../constants/teamInviteDesignFlags';
import { useTeamMembers } from '../context/TeamMembersContext';

export function TeamScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const tabBarHeight = useBottomTabBarHeight();
  const team = useTeamMembers();
  const showPlanCta = team.teamGateSettled && team.showTeamRow && !team.canManageTeam;

  useEffect(() => {
    if (team.teamGateSettled && !team.showTeamRow) {
      navigation.goBack();
    }
  }, [navigation, team.showTeamRow, team.teamGateSettled]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          position: 'relative',
        },
        ctaScroll: {
          flex: 1,
        },
        ctaContent: {
          paddingBottom: 28 + Math.max(tabBarHeight, 72),
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
        loading: {
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 16,
        },
      }),
    [colors, tabBarHeight],
  );

  if (!team.teamGateSettled) {
    return (
      <View style={styles.root}>
        <View style={styles.loading}>
          <TeamMembersSkeleton />
        </View>
      </View>
    );
  }

  if (showPlanCta) {
    return (
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.ctaContent}
          keyboardShouldPersistTaps="handled"
          style={styles.ctaScroll}
        >
          <TeamPlanCta />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TeamMembersPanel
        error={team.listError}
        isLoading={team.isLoading}
        isRefreshing={Boolean(team.isFetching && !team.isLoading)}
        members={team.members}
        onAdd={team.openInvite}
        onPressMember={(member) => {
          navigation.navigate(ROUTES.TEAM_MEMBER_DETAILS, { memberId: member.id });
        }}
        onRefresh={team.refetch}
        onRetry={team.refetch}
      />
      {team.canManageTeam ? <AddTeamMemberFab onPress={team.openInvite} /> : null}
      <InviteTeamMemberSheet
        designPreview={__DEV__ && TEAM_INVITE_DESIGN_PREVIEW}
        visible={team.inviteOpen}
        onInvite={team.handleInvite}
        onRequestClose={team.closeInvite}
      />
    </View>
  );
}
