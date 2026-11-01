import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { InviteTeamMemberSheet } from '../components/InviteTeamMemberSheet';
import {
  TEAM_INVITE_ERROR_TITLE,
  TEAM_INVITE_PENDING_TITLE,
  TEAM_INVITE_SHEET_BODY,
  TEAM_INVITE_SUCCESS_TITLE,
} from '../constants/teamMembersCopy';
import { TEAM_ROLE_COPY } from '../constants/teamRoles';

describe('InviteTeamMemberSheet', () => {
  it('previews pending, success, and error inside the sheet', () => {
    renderWithProviders(
      <InviteTeamMemberSheet
        designPreview
        visible
        onInvite={jest.fn()}
        onRequestClose={jest.fn()}
      />,
    );

    expect(screen.getByText(TEAM_INVITE_SHEET_BODY)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Preview Sending' }));
    expect(screen.getByText(TEAM_INVITE_PENDING_TITLE)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Preview Sent' }));
    expect(screen.getByText(TEAM_INVITE_SUCCESS_TITLE)).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Preview Error' }));
    expect(screen.getByText(TEAM_INVITE_ERROR_TITLE)).toBeTruthy();
  });

  it('defaults the invite role to Member and sends the chosen role', async () => {
    const onInvite = jest.fn(async () => ({ ok: true }));
    renderWithProviders(
      <InviteTeamMemberSheet visible onInvite={onInvite} onRequestClose={jest.fn()} />,
    );

    expect(screen.getByText('Member')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: /Role\. Currently Member/ }));
    expect(screen.getByText(TEAM_ROLE_COPY.member.description)).toBeTruthy();
    expect(screen.getByText(TEAM_ROLE_COPY.coordinator.description)).toBeTruthy();
    expect(screen.getByText(TEAM_ROLE_COPY.manager.description)).toBeTruthy();
    fireEvent.press(screen.getByRole('menuitem', { name: 'Coordinator' }));

    expect(screen.getByText('Coordinator')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Name'), 'Sam');
    fireEvent.changeText(screen.getByLabelText('Email'), 'sam@example.com');
    fireEvent.press(screen.getByRole('button', { name: 'Send invite' }));

    expect(onInvite).toHaveBeenCalledWith('sam@example.com', 'Sam', 'coordinator');
    expect(await screen.findByText(TEAM_INVITE_SUCCESS_TITLE)).toBeTruthy();
  });
});
