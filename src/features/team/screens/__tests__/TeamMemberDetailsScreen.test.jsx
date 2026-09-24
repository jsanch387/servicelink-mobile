import { Alert } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { fetchTeamRosterForShop } from '../../api/fetchTeamRosterForOwner';
import { updateTeamMemberDisplayName } from '../../api/persistTeamInviteName';
import { postTeamRemove } from '../../api/postTeamRemove';
import {
  TEAM_MEMBER_EDIT_NAME,
  TEAM_MEMBER_NAME_SAVED_TOAST,
  TEAM_MEMBER_NOT_FOUND,
  TEAM_MEMBER_SAVE_NAME,
  TEAM_REMOVE_BUTTON,
  TEAM_REMOVE_CONFIRM_BUTTON,
  TEAM_REMOVE_SHEET_BODY,
} from '../../constants/teamMembersCopy';
import { TeamMembersProvider } from '../../context/TeamMembersContext';
import { TeamMemberDetailsScreen } from '../TeamMemberDetailsScreen';

const mockGoBack = jest.fn();
let mockMemberId = 'mem-1';

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ goBack: mockGoBack }),
    useRoute: () => ({ params: { memberId: mockMemberId } }),
  };
});

jest.mock('../../constants/teamFeatureFlags', () => ({
  TEAM_FEATURE_ENABLED: true,
  TEAM_EARLY_ACCESS_EMAILS: [],
}));

jest.mock('../../../auth', () => ({
  useAuth: () => ({ user: { id: 'owner-1' } }),
}));

jest.mock('../../../auth/api/auth', () => ({
  getSession: jest.fn(async () => ({
    data: { session: { access_token: 'test-token' } },
    error: null,
  })),
}));

jest.mock('../../api/persistTeamInviteName', () => ({
  persistTeamInviteName: jest.fn(async () => {}),
  updateTeamMemberDisplayName: jest.fn(async () => {}),
}));

jest.mock('../../api/postTeamRemove', () => ({
  postTeamRemove: jest.fn(async () => ({ ok: true })),
}));

jest.mock('../../../home/api/homeDashboard', () => ({
  fetchBusinessProfileForUser: jest.fn(async () => ({
    data: { id: 'biz-1' },
    error: null,
  })),
}));

jest.mock('../../api/fetchTeamRosterForOwner', () => ({
  fetchTeamRosterForShop: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

const jordan = {
  id: 'mem-1',
  name: 'Jordan',
  email: 'jordan@example.com',
  phone: '',
  status: 'active',
  source: 'member',
};

const alex = {
  id: 'inv-1',
  name: '',
  email: 'alex@example.com',
  phone: '',
  status: 'invited',
  source: 'invite',
};

function mockRoster(members) {
  fetchTeamRosterForShop.mockResolvedValue({
    shopId: 'biz-1',
    members,
    error: null,
  });
}

function renderDetails() {
  return renderWithProviders(
    <TeamMembersProvider>
      <TeamMemberDetailsScreen />
    </TeamMembersProvider>,
  );
}

describe('TeamMemberDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMemberId = 'mem-1';
    mockRoster([jordan, alex]);
  });

  it('shows contact details and edits the name', async () => {
    renderDetails();

    expect(await screen.findByText('Jordan')).toBeTruthy();
    expect(screen.getByText('jordan@example.com')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: TEAM_MEMBER_EDIT_NAME }));
    fireEvent.changeText(screen.getByDisplayValue('Jordan'), 'Jordan Lee');
    fireEvent.press(screen.getByRole('button', { name: TEAM_MEMBER_SAVE_NAME }));

    await waitFor(() => {
      expect(updateTeamMemberDisplayName).toHaveBeenCalledWith(
        'biz-1',
        expect.objectContaining({ id: 'mem-1' }),
        'Jordan Lee',
      );
    });
    expect(await screen.findByText(TEAM_MEMBER_NAME_SAVED_TOAST)).toBeTruthy();
  });

  it('confirms remove with the native alert and goes back', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => {
      const remove = buttons.find((b) => b.style === 'destructive');
      remove.onPress();
    });

    renderDetails();
    expect(await screen.findByText('jordan@example.com')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: TEAM_REMOVE_BUTTON }));

    expect(alertSpy).toHaveBeenCalledWith('Remove Jordan?', TEAM_REMOVE_SHEET_BODY, [
      { text: 'Cancel', style: 'cancel' },
      expect.objectContaining({ text: TEAM_REMOVE_CONFIRM_BUTTON, style: 'destructive' }),
    ]);

    await waitFor(() => {
      expect(postTeamRemove).toHaveBeenCalledWith('test-token', {
        id: 'mem-1',
        source: 'member',
      });
    });
    await waitFor(() => expect(mockGoBack).toHaveBeenCalled());

    alertSpy.mockRestore();
  });

  it('stays on the screen when remove fails', async () => {
    postTeamRemove.mockResolvedValue({
      ok: false,
      httpStatus: 403,
      userMessage: 'Only the shop owner can remove team members.',
    });
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => {
      const remove = buttons.find((b) => b.style === 'destructive');
      remove.onPress();
    });

    renderDetails();
    expect(await screen.findByText('jordan@example.com')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: TEAM_REMOVE_BUTTON }));

    expect(await screen.findByText('Only the shop owner can remove team members.')).toBeTruthy();
    expect(mockGoBack).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('shows not found when the member is gone', async () => {
    mockMemberId = 'missing';
    renderDetails();

    expect(await screen.findByText(TEAM_MEMBER_NOT_FOUND)).toBeTruthy();
  });
});
