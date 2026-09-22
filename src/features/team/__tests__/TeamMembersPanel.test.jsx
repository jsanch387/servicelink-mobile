import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import {
  TEAM_HOW_IT_WORKS_DISMISS_LABEL,
  TEAM_HOW_IT_WORKS_LINK_LABEL,
  TEAM_HOW_IT_WORKS_TITLE,
} from '../constants/teamHowItWorksCopy';
import {
  TEAM_MEMBERS_EMPTY_BODY,
  TEAM_MEMBERS_EMPTY_TITLE,
  TEAM_MEMBERS_LOADING,
} from '../constants/teamMembersCopy';
import { TeamMembersPanel } from '../components/TeamMembersPanel';

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

const members = [
  {
    id: 'mem-1',
    name: '',
    email: 'jordan@example.com',
    phone: '',
    status: 'active',
    source: 'member',
  },
  {
    id: 'inv-1',
    name: '',
    email: 'alex@example.com',
    phone: '',
    status: 'invited',
    source: 'invite',
  },
];

describe('TeamMembersPanel', () => {
  it('shows a separate card per member and opens details from the row', () => {
    const onPressMember = jest.fn();
    renderWithProviders(<TeamMembersPanel members={members} onPressMember={onPressMember} />);

    expect(screen.getByText('Jordan')).toBeTruthy();
    expect(screen.getByText('jordan@example.com')).toBeTruthy();
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.getByText('alex@example.com')).toBeTruthy();
    expect(screen.queryByText('Invited')).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Jordan' }));
    expect(onPressMember).toHaveBeenCalledWith(expect.objectContaining({ id: 'mem-1' }));
  });

  it('shows the empty card when there are no members', async () => {
    const onAdd = jest.fn();
    renderWithProviders(<TeamMembersPanel members={[]} onAdd={onAdd} />);

    expect(screen.getByText(TEAM_MEMBERS_EMPTY_TITLE)).toBeTruthy();
    expect(screen.getByText(TEAM_MEMBERS_EMPTY_BODY)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Add member' }));
    expect(onAdd).toHaveBeenCalled();

    fireEvent.press(screen.getByRole('button', { name: TEAM_HOW_IT_WORKS_LINK_LABEL }));
    expect(screen.getByText(TEAM_HOW_IT_WORKS_TITLE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: TEAM_HOW_IT_WORKS_DISMISS_LABEL }));
    await waitFor(() => expect(screen.queryByText(TEAM_HOW_IT_WORKS_TITLE)).toBeNull());
  });

  it('shows a list skeleton while the roster loads', () => {
    renderWithProviders(<TeamMembersPanel isLoading members={[]} />);

    expect(screen.getByLabelText(TEAM_MEMBERS_LOADING)).toBeTruthy();
    expect(screen.queryByText(TEAM_MEMBERS_EMPTY_TITLE)).toBeNull();
  });
});
