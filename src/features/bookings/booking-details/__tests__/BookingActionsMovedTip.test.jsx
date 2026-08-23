import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { BookingActionsMovedTip } from '../components/BookingActionsMovedTip';

describe('BookingActionsMovedTip', () => {
  it('opens actions from the message and dismisses from close', () => {
    const onDismiss = jest.fn();
    const onPressActions = jest.fn();
    renderWithProviders(
      <BookingActionsMovedTip onDismiss={onDismiss} onPressActions={onPressActions} />,
    );

    expect(screen.getByText('Actions have moved')).toBeTruthy();
    fireEvent.press(screen.getByLabelText("Actions have moved. They're in the top right."));
    expect(onPressActions).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
