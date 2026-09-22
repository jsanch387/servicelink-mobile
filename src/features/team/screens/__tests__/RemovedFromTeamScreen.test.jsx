import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import {
  REMOVED_FROM_TEAM_LOG_OUT,
  REMOVED_FROM_TEAM_START_BUSINESS,
  REMOVED_FROM_TEAM_TITLE,
} from '../../constants/removedFromTeamCopy';
import { RemovedFromTeamScreen } from '../RemovedFromTeamScreen';

const mockSignOut = jest.fn(async () => ({ error: null }));
const mockStartOwnBusiness = jest.fn();

jest.mock('../../../auth', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
}));

jest.mock('../../../onboarding', () => ({
  useOnboardingGate: () => ({ startOwnBusiness: mockStartOwnBusiness }),
}));

describe('RemovedFromTeamScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs out or starts owner onboarding', async () => {
    renderWithProviders(<RemovedFromTeamScreen />);

    expect(screen.getByTestId('removed-from-team-screen')).toBeTruthy();
    expect(screen.getByText(REMOVED_FROM_TEAM_TITLE)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(REMOVED_FROM_TEAM_START_BUSINESS));
    expect(mockStartOwnBusiness).toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText(REMOVED_FROM_TEAM_LOG_OUT));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
