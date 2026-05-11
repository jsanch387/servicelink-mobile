import * as Clipboard from 'expo-clipboard';
import { act, fireEvent, screen } from '@testing-library/react-native';
import { AccountBookingLinkCard } from '../components/AccountBookingLinkCard';
import { renderWithProviders } from '../../home/__tests__/testUtils';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(() => Promise.resolve()),
}));

describe('AccountBookingLinkCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('copies https url when pressing copy', async () => {
    renderWithProviders(
      <AccountBookingLinkCard
        canEditSlug
        displayLink="myservicelink.app/demo"
        hasSlug
        httpsUrl="https://myservicelink.app/demo"
        onChangeLink={jest.fn()}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Copy booking link'));
    });

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith('https://myservicelink.app/demo');
  });

  it('calls change-link action', () => {
    const onChangeLink = jest.fn();
    renderWithProviders(
      <AccountBookingLinkCard
        canEditSlug
        displayLink="myservicelink.app/demo"
        hasSlug
        httpsUrl="https://myservicelink.app/demo"
        onChangeLink={onChangeLink}
      />,
    );

    fireEvent.press(screen.getByLabelText('Change booking link'));
    expect(onChangeLink).toHaveBeenCalledTimes(1);
  });
});
