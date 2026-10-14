import { fireEvent, screen } from '@testing-library/react-native';
import { Modal } from 'react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import {
  BOOKING_ACTIONS_AFTER_DISMISS_MS,
  BOOKING_ACTIONS_HANDOFF_MS,
  BookingActionsSheet,
} from '../booking-details/components/BookingActionsSheet';

function renderSheet(props = {}) {
  return renderWithProviders(
    <BookingActionsSheet
      visible
      onCancelBooking={jest.fn()}
      onMarkCompleted={jest.fn()}
      onRequestClose={jest.fn()}
      onReschedule={jest.fn()}
      {...props}
    />,
  );
}

describe('BookingActionsSheet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows Job status when enabled and calls onJobStatusPress after close', () => {
    const onJobStatusPress = jest.fn();
    const onRequestClose = jest.fn();
    renderSheet({ showJobStatusAction: true, onJobStatusPress, onRequestClose });
    expect(screen.getByLabelText('Job status')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Job status'));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(onJobStatusPress).not.toHaveBeenCalled();
    jest.advanceTimersByTime(BOOKING_ACTIONS_HANDOFF_MS);
    expect(onJobStatusPress).toHaveBeenCalledTimes(1);
  });

  it('runs reschedule when the actions sheet finishes dismissing', () => {
    const onReschedule = jest.fn();
    const { UNSAFE_getByType } = renderSheet({ onReschedule });
    fireEvent.press(screen.getByLabelText('Reschedule booking'));
    expect(onReschedule).not.toHaveBeenCalled();
    UNSAFE_getByType(Modal).props.onDismiss();
    expect(onReschedule).not.toHaveBeenCalled();
    jest.advanceTimersByTime(BOOKING_ACTIONS_AFTER_DISMISS_MS);
    expect(onReschedule).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(BOOKING_ACTIONS_HANDOFF_MS);
    expect(onReschedule).toHaveBeenCalledTimes(1);
  });

  it('hides Job status when showJobStatusAction is false', () => {
    renderSheet({ showJobStatusAction: false });
    expect(screen.queryByLabelText('Job status')).toBeNull();
  });

  it('still shows Complete enabled alongside Job status', () => {
    const onMarkCompleted = jest.fn();
    renderSheet({ showJobStatusAction: true, onMarkCompleted });
    const complete = screen.getByLabelText('Mark booking complete');
    expect(complete).toBeTruthy();
    fireEvent.press(complete);
    jest.advanceTimersByTime(BOOKING_ACTIONS_HANDOFF_MS);
    expect(onMarkCompleted).toHaveBeenCalledTimes(1);
  });

  it('hides create-style writes and keeps Complete plus Job status', () => {
    renderSheet({ canWriteBookings: false, showJobStatusAction: true });
    expect(screen.getByLabelText('Job status')).toBeTruthy();
    expect(screen.getByLabelText('Mark booking complete')).toBeTruthy();
    expect(screen.queryByLabelText('Edit booking')).toBeNull();
    expect(screen.queryByLabelText('Reschedule booking')).toBeNull();
    expect(screen.queryByLabelText('Cancel booking')).toBeNull();
  });
});
