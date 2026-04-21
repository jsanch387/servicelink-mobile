import * as Clipboard from 'expo-clipboard';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { LinkStatsSection } from '../components/LinkStatsSection';
import { renderWithProviders } from './testUtils';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

describe('LinkStatsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  it('shows skeleton state while loading', () => {
    renderWithProviders(
      <LinkStatsSection businessError={null} isLoading profileViews={null} slug="" />,
    );
    expect(screen.queryByText('Link views')).toBeNull();
    expect(screen.queryByText(/Booking link unavailable/)).toBeNull();
  });

  it('shows profile views and copyable link when loaded', () => {
    renderWithProviders(
      <LinkStatsSection businessError={null} isLoading={false} profileViews={42} slug="acme" />,
    );
    expect(screen.getByText('42')).toBeTruthy();
    expect(screen.getByText('Views')).toBeTruthy();
    expect(screen.getByText('myservicelink.app/acme')).toBeTruthy();
  });

  it('shows error state when business failed', () => {
    renderWithProviders(
      <LinkStatsSection businessError="Network down" isLoading={false} profileViews={0} slug="" />,
    );
    expect(screen.getByText('Network down')).toBeTruthy();
    expect(screen.getByText('Link unavailable until your business profile loads.')).toBeTruthy();
  });

  it('copies https URL when copy is pressed', async () => {
    renderWithProviders(
      <LinkStatsSection businessError={null} isLoading={false} profileViews={1} slug="shop" />,
    );
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Copy booking link'));
    });
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('https://myservicelink.app/shop');
  });
});
