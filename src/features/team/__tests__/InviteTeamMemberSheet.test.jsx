import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { InviteTeamMemberSheet } from '../components/InviteTeamMemberSheet';
import {
  TEAM_INVITE_ERROR_TITLE,
  TEAM_INVITE_PENDING_TITLE,
  TEAM_INVITE_SHEET_BODY,
  TEAM_INVITE_SUCCESS_TITLE,
} from '../constants/teamMembersCopy';

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
});
