import * as Clipboard from 'expo-clipboard';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { LinkStatsSection } from '../components/LinkStatsSection';
import { renderWithProviders } from './testUtils';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

const mockShowWebAccountFeatureAlert = jest.fn();

jest.mock('../../subscription', () => ({
  showWebAccountFeatureAlert: (...args) => mockShowWebAccountFeatureAlert(...args),
}));

describe('LinkStatsSection', () => {
  const onPeriodChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockShowWebAccountFeatureAlert.mockClear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-21T12:00:00.000Z'));
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  it('shows skeleton state while loading', () => {
    renderWithProviders(<LinkStatsSection businessError={null} isLoading slug="" views={0} />);
    expect(screen.queryByText('Views')).toBeNull();
    expect(screen.queryByText(/Link unavailable/)).toBeNull();
  });

  it('shows count, period under count, dropdown, last visit, and copyable link when loaded', () => {
    renderWithProviders(
      <LinkStatsSection
        businessError={null}
        effectivePeriod="7d"
        hasProAccess
        isLoading={false}
        lastViewedAt="2026-05-21T11:30:00.000Z"
        onPeriodChange={onPeriodChange}
        period="7d"
        slug="acme"
        views={42}
      />,
    );
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('Last 7 days')).toBeTruthy();
    expect(screen.getByText('7 days')).toBeTruthy();
    expect(screen.queryByText('Views')).toBeNull();
    expect(screen.getByLabelText('Time range: 7 days. Tap to change.')).toBeTruthy();
    expect(screen.getByText('30m ago')).toBeTruthy();
    expect(screen.getByText('myservicelink.app/acme')).toBeTruthy();
  });

  it('hides last-visit line when visit count is zero', () => {
    renderWithProviders(
      <LinkStatsSection
        businessError={null}
        isLoading={false}
        lastViewedAt={null}
        period="24h"
        slug="acme"
        views={0}
      />,
    );
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('Last 24 hours')).toBeTruthy();
    expect(screen.queryByText('Never')).toBeNull();
    expect(screen.queryByText(/ago/)).toBeNull();
  });

  it('shows error state when business failed', () => {
    renderWithProviders(
      <LinkStatsSection
        businessError="Network down"
        isLoading={false}
        period="24h"
        slug=""
        views={0}
      />,
    );
    expect(screen.getByText('Network down')).toBeTruthy();
    expect(screen.getByText('Link unavailable until your business profile loads.')).toBeTruthy();
  });

  it('copies https URL when copy is pressed', async () => {
    renderWithProviders(
      <LinkStatsSection
        businessError={null}
        isLoading={false}
        period="24h"
        slug="shop"
        views={1}
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Copy booking link'));
    });
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('https://myservicelink.app/shop');
  });

  it('shows web account alert when free user taps a longer range', () => {
    renderWithProviders(
      <LinkStatsSection
        businessError={null}
        hasProAccess={false}
        isLoading={false}
        onPeriodChange={onPeriodChange}
        period="24h"
        slug="acme"
        views={3}
      />,
    );
    fireEvent.press(screen.getByLabelText('Time range: 24 hours. Tap to change.'));
    fireEvent.press(screen.getByLabelText('Last 30 days, available on the web'));
    expect(mockShowWebAccountFeatureAlert).toHaveBeenCalled();
    expect(onPeriodChange).not.toHaveBeenCalledWith('30d');
  });

  it('opens time range sheet and selects a period', () => {
    renderWithProviders(
      <LinkStatsSection
        businessError={null}
        hasProAccess
        isLoading={false}
        onPeriodChange={onPeriodChange}
        period="24h"
        slug="acme"
        views={3}
      />,
    );
    fireEvent.press(screen.getByLabelText('Time range: 24 hours. Tap to change.'));
    expect(screen.getByText('Time range')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Last 30 days'));
    expect(onPeriodChange).toHaveBeenCalledWith('30d');
  });
});
