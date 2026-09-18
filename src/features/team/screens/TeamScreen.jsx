import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';
import { AddTeamMemberFab } from '../components/AddTeamMemberFab';
import { InviteTeamMemberSheet } from '../components/InviteTeamMemberSheet';
import { RemoveTeamMemberSheet } from '../components/RemoveTeamMemberSheet';
import { TeamMembersPanel } from '../components/TeamMembersPanel';
import { TEAM_INVITE_DESIGN_PREVIEW } from '../constants/teamInviteDesignFlags';
import { useTeamMembers } from '../context/TeamMembersContext';

export function TeamScreen() {
  const { colors } = useTheme();
  const team = useTeamMembers();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          position: 'relative',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <TeamMembersPanel
        error={team.listError}
        isLoading={team.isLoading}
        isRefreshing={Boolean(team.isFetching && !team.isLoading)}
        members={team.members}
        onAdd={team.openInvite}
        onRefresh={team.refetch}
        onRemove={team.setMemberToRemove}
        onRetry={team.refetch}
      />
      {team.showTeamRow ? <AddTeamMemberFab onPress={team.openInvite} /> : null}
      <InviteTeamMemberSheet
        designPreview={__DEV__ && TEAM_INVITE_DESIGN_PREVIEW}
        visible={team.inviteOpen}
        onInvite={team.handleInvite}
        onRequestClose={team.closeInvite}
      />
      <RemoveTeamMemberSheet
        member={team.memberToRemove}
        onConfirm={team.handleRemove}
        onRequestClose={team.closeRemove}
      />
    </View>
  );
}
