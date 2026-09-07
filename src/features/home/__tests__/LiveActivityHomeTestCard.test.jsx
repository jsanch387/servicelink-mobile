import { act, fireEvent, screen } from '@testing-library/react-native';
import { LiveActivityHomeTestCard } from '../components/LiveActivityHomeTestCard';
import { renderWithProviders } from './testUtils';

const mockStartJobLiveActivity = jest.fn(() => Promise.resolve({ ok: true }));
const mockEndJobLiveActivity = jest.fn(() => Promise.resolve());

jest.mock('../../bookings/live-activity/jobLiveActivity', () => ({
  startJobLiveActivity: (...args) => mockStartJobLiveActivity(...args),
  endJobLiveActivity: (...args) => mockEndJobLiveActivity(...args),
}));

describe('LiveActivityHomeTestCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts the island timer from slide to start', async () => {
    renderWithProviders(<LiveActivityHomeTestCard />);

    expect(screen.getByText('Slide to start job')).toBeTruthy();
    expect(screen.getByText('Alex Rivera')).toBeTruthy();

    const track = screen.getByTestId('slide-to-start-job-track');
    await act(async () => {
      track.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    });

    expect(mockStartJobLiveActivity).toHaveBeenCalledWith({
      id: 'live-activity-home-test',
      customer_name: 'Alex Rivera',
      service_name: 'Full Interior',
    });
    expect(await screen.findByLabelText('Done')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
    expect(screen.getByLabelText('Job elapsed time')).toBeTruthy();
    expect(screen.queryByText('Island timer running')).toBeNull();
    expect(screen.queryByText(/Swipe home or lock the phone/)).toBeNull();
  });

  it('stays on the slide when the island cannot start', async () => {
    mockStartJobLiveActivity.mockResolvedValueOnce({
      ok: false,
      reason: 'disabled',
    });
    renderWithProviders(<LiveActivityHomeTestCard />);

    const track = screen.getByTestId('slide-to-start-job-track');
    await act(async () => {
      track.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    });

    expect(screen.getByText('Slide to start job')).toBeTruthy();
    expect(screen.queryByLabelText('Done')).toBeNull();
    expect(screen.getByText('Turn on Live Activities in Settings → ServiceLink.')).toBeTruthy();
  });

  it('stops the timer on Done and returns to the slide', async () => {
    renderWithProviders(<LiveActivityHomeTestCard />);

    const track = screen.getByTestId('slide-to-start-job-track');
    await act(async () => {
      track.props.onAccessibilityAction({ nativeEvent: { actionName: 'activate' } });
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Done'));
    });

    expect(mockEndJobLiveActivity).toHaveBeenCalledWith('live-activity-home-test');
    expect(screen.getByText('Slide to start job')).toBeTruthy();
  });
});
