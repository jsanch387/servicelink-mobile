import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
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
  it('shows a separate card per member and calls onRemove from trash', () => {
    const onRemove = jest.fn();
    renderWithProviders(<TeamMembersPanel members={members} onRemove={onRemove} />);

    expect(screen.getByText('jordan@example.com')).toBeTruthy();
    expect(screen.getByText('alex@example.com')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Remove jordan@example.com' }));
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ id: 'mem-1' }));
  });

  it('shows the empty card when there are no members', () => {
    const onAdd = jest.fn();
    renderWithProviders(<TeamMembersPanel members={[]} onAdd={onAdd} onRemove={jest.fn()} />);

    expect(screen.getByText(TEAM_MEMBERS_EMPTY_TITLE)).toBeTruthy();
    expect(screen.getByText(TEAM_MEMBERS_EMPTY_BODY)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Add member' }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('shows echo bars while the roster loads', () => {
    renderWithProviders(<TeamMembersPanel isLoading members={[]} onRemove={jest.fn()} />);

    expect(screen.getByText(TEAM_MEMBERS_LOADING)).toBeTruthy();
    expect(screen.queryByText(TEAM_MEMBERS_EMPTY_TITLE)).toBeNull();
  });
});
