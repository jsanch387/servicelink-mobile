import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { SubscriptionsCreatePlanOutcome } from '../components/SubscriptionsCreatePlanOutcome';

describe('SubscriptionsCreatePlanOutcome', () => {
  it('shows echo-bars pending copy', () => {
    renderWithProviders(
      <SubscriptionsCreatePlanOutcome phase="pending" onDone={jest.fn()} onRetry={jest.fn()} />,
    );

    expect(screen.getAllByLabelText('Creating subscription').length).toBeGreaterThan(0);
    expect(screen.getByText('Creating subscription')).toBeTruthy();
  });

  it('shows the shared success moment and Done', () => {
    const onDone = jest.fn();
    renderWithProviders(
      <SubscriptionsCreatePlanOutcome phase="success" onDone={onDone} onRetry={jest.fn()} />,
    );

    expect(screen.getByText('Your subscription is ready')).toBeTruthy();
    expect(screen.getByText('Customers can choose it when they book.')).toBeTruthy();
    fireEvent.press(screen.getByText('Done'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('shows the shared error card and retries', () => {
    const onRetry = jest.fn();
    renderWithProviders(
      <SubscriptionsCreatePlanOutcome
        errorMessage="Stripe is unavailable"
        phase="error"
        onDone={jest.fn()}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText("Couldn't create subscription")).toBeTruthy();
    expect(screen.getByText('Stripe is unavailable')).toBeTruthy();
    fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
