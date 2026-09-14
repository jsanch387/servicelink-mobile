import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import {
  TEAM_INVITE_SENT_TOAST,
  TEAM_MEMBERS_ADD_BUTTON,
  TEAM_MEMBERS_EMPTY_BODY,
  TEAM_MEMBERS_EMPTY_TITLE,
  TEAM_MEMBERS_INVITE_A11Y,
  TEAM_REMOVE_TOAST,
} from '../constants/teamMembersCopy';
import { TeamMembersPanel } from '../components/TeamMembersPanel';

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

describe('TeamMembersPanel', () => {
  it('shows the empty state and opens invite from Add member', () => {
    renderWithProviders(<TeamMembersPanel />);

    expect(screen.getByText(TEAM_MEMBERS_EMPTY_TITLE)).toBeTruthy();
    expect(screen.getByText(TEAM_MEMBERS_EMPTY_BODY)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: TEAM_MEMBERS_ADD_BUTTON }));

    expect(screen.getByText('Send an invite so they can join your team.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send invite' })).toBeTruthy();
  });

  it('adds an invited member from the plus button, then removes them', async () => {
    renderWithProviders(<TeamMembersPanel />);

    fireEvent.press(screen.getByRole('button', { name: TEAM_MEMBERS_INVITE_A11Y }));
    fireEvent.changeText(screen.getByLabelText('Email'), 'Jordan@Example.com');
    fireEvent.press(screen.getByRole('button', { name: 'Send invite' }));

    await waitFor(() => expect(screen.getByText('jordan@example.com')).toBeTruthy());
    expect(screen.getByText('Invited')).toBeTruthy();
    expect(screen.getByText(TEAM_INVITE_SENT_TOAST)).toBeTruthy();
    expect(screen.queryByText(TEAM_MEMBERS_EMPTY_TITLE)).toBeNull();

    fireEvent.press(screen.getByRole('button', { name: 'Remove jordan@example.com' }));
    fireEvent.press(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(screen.getByText(TEAM_MEMBERS_EMPTY_TITLE)).toBeTruthy());
    expect(screen.getByText(TEAM_REMOVE_TOAST)).toBeTruthy();
  });
});
