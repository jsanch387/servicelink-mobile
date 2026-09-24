import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ROUTES } from '../../../routes/routes';
import { useTheme } from '../../../theme';
import { AddTeamMemberFab } from '../components/AddTeamMemberFab';
import { InviteTeamMemberSheet } from '../components/InviteTeamMemberSheet';
import { TeamMembersPanel } from '../components/TeamMembersPanel';
import { TEAM_INVITE_DESIGN_PREVIEW } from '../constants/teamInviteDesignFlags';
import { useTeamMembers } from '../context/TeamMembersContext';

export function TeamScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const team = useTeamMembers();

  useEffect(() => {
    if (!team.showTeamRow) {
      navigation.goBack();
    }
  }, [navigation, team.showTeamRow]);

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
        onPressMember={(member) => {
          navigation.navigate(ROUTES.TEAM_MEMBER_DETAILS, { memberId: member.id });
        }}
        onRefresh={team.refetch}
        onRetry={team.refetch}
      />
      {team.showTeamRow ? <AddTeamMemberFab onPress={team.openInvite} /> : null}
      <InviteTeamMemberSheet
        designPreview={__DEV__ && TEAM_INVITE_DESIGN_PREVIEW}
        visible={team.inviteOpen}
        onInvite={team.handleInvite}
        onRequestClose={team.closeInvite}
      />
    </View>
  );
}
