import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { ROUTES } from '../../../routes/routes';
import { TeamMembersProvider } from '../context/TeamMembersContext';
import { fetchTeamRosterForShop } from '../api/fetchTeamRosterForOwner';
import { postTeamInvite } from '../api/postTeamInvite';
import { TEAM_PLAN_ACCESS_CTA, TEAM_PLAN_ACCESS_TITLE } from '../constants/teamPlanAccessCopy';
import { TEAM_INVITE_SUCCESS_TITLE } from '../constants/teamMembersCopy';
import { TeamScreen } from '../screens/TeamScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: mockNavigate, goBack: mockGoBack }),
  };
});

jest.mock('../constants/teamInviteDesignFlags', () => ({
  TEAM_INVITE_DESIGN_PREVIEW: false,
}));

jest.mock('../constants/teamFeatureFlags', () => ({
  TEAM_FEATURE_ENABLED: true,
  TEAM_EARLY_ACCESS_EMAILS: [],
}));

jest.mock('../../auth', () => ({
  useAuth: () => ({ user: { id: 'owner-1' } }),
}));

jest.mock('../../subscription', () => ({
  useSubscription: () => mockSubscription,
}));

const mockSubscription = {
  hasProAccess: true,
  isOwnerProfileLoaded: true,
  ownerProfile: { subscription_plan: 'team', subscription_tier: 'pro' },
};

jest.mock('../../auth/api/auth', () => ({
  getSession: jest.fn(async () => ({
    data: { session: { access_token: 'test-token' } },
    error: null,
  })),
}));

jest.mock('../api/postTeamInvite', () => ({
  postTeamInvite: jest.fn(async () => ({ ok: true, resent: false })),
}));

jest.mock('../api/persistTeamInviteName', () => ({
  persistTeamInviteName: jest.fn(async () => {}),
  updateTeamMemberDisplayName: jest.fn(async () => {}),
}));

jest.mock('../../home/api/homeDashboard', () => ({
  fetchBusinessProfileForUser: jest.fn(async () => ({
    data: { id: 'biz-1', profile_id: 'owner-1', team_included: false },
    error: null,
  })),
}));

jest.mock('../api/fetchTeamRosterForOwner', () => ({
  fetchTeamRosterForShop: jest.fn(),
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 80,
}));

const jordan = {
  id: 'mem-1',
  name: '',
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

const sam = {
  id: 'inv-2',
  name: '',
  email: 'sam@example.com',
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

function renderTeamScreen() {
  return renderWithProviders(
    <TeamMembersProvider>
      <TeamScreen />
    </TeamMembersProvider>,
  );
}

describe('TeamScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscription.hasProAccess = true;
    mockSubscription.isOwnerProfileLoaded = true;
    mockSubscription.ownerProfile = { subscription_plan: 'team', subscription_tier: 'pro' };
    mockRoster([jordan, alex]);
  });

  it('shows the web subscribe card for Pro or free', async () => {
    mockSubscription.ownerProfile = { subscription_plan: null, subscription_tier: 'pro' };
    renderTeamScreen();

    expect(await screen.findByText(TEAM_PLAN_ACCESS_TITLE)).toBeTruthy();
    expect(fetchTeamRosterForShop).not.toHaveBeenCalled();
    expect(mockGoBack).not.toHaveBeenCalled();
    expect(screen.queryByText('jordan@example.com')).toBeNull();

    const openUrl = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    fireEvent.press(screen.getByRole('button', { name: TEAM_PLAN_ACCESS_CTA }));
    expect(openUrl).toHaveBeenCalledWith(expect.stringContaining('/login'));
    openUrl.mockRestore();
  });

  it('loads members from the shop roster', async () => {
    renderTeamScreen();

    expect(await screen.findByText('jordan@example.com')).toBeTruthy();
    expect(screen.getByText('alex@example.com')).toBeTruthy();
  });

  it('opens invite from the FAB', async () => {
    renderTeamScreen();
    await screen.findByText('jordan@example.com');

    fireEvent.press(screen.getByRole('button', { name: 'Add member' }));
    expect(screen.getByText("We'll send an invite link to their email.")).toBeTruthy();
  });

  it('opens member details from a row', async () => {
    renderTeamScreen();
    await screen.findByText('jordan@example.com');

    fireEvent.press(screen.getByRole('button', { name: 'Jordan' }));
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.TEAM_MEMBER_DETAILS, { memberId: 'mem-1' });
  });

  it('adds an invited member after the server accepts the invite', async () => {
    postTeamInvite.mockImplementation(async () => {
      mockRoster([jordan, alex, sam]);
      return { ok: true, resent: false };
    });

    renderTeamScreen();
    await screen.findByText('jordan@example.com');

    fireEvent.press(screen.getByRole('button', { name: 'Add member' }));
    fireEvent.changeText(screen.getByLabelText('Name'), 'Sam');
    fireEvent.changeText(screen.getByLabelText('Email'), 'Sam@Example.com');
    fireEvent.press(screen.getByRole('button', { name: 'Send invite' }));

    expect(await screen.findByText(TEAM_INVITE_SUCCESS_TITLE)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.getByText('Sam')).toBeTruthy());
    expect(screen.getByText('sam@example.com')).toBeTruthy();
    expect(postTeamInvite).toHaveBeenCalledWith('test-token', 'sam@example.com', 'Sam');
  });
});
