import { FloatingActionButton } from '../../../components/ui';
import { TEAM_MEMBERS_ADD_BUTTON } from '../constants/teamMembersCopy';

/**
 * Wrapper for team-member icon/copy; shared geometry lives in `FloatingActionButton`.
 */
export function AddTeamMemberFab({ onPress, bottom = 30 }) {
  return (
    <FloatingActionButton
      accessibilityHint="Asks for a name and email so you can send an invite link"
      accessibilityLabel={TEAM_MEMBERS_ADD_BUTTON}
      bottom={bottom}
      iconLibrary="material-community"
      iconName="account-group-outline"
      onPress={onPress}
    />
  );
}
