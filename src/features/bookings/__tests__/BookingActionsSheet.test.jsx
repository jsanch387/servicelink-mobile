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
      canDeleteBookings
      onCancelBooking={jest.fn()}
      onDeleteBooking={jest.fn()}
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

  it('hides reschedule and cancel for an appointment request', () => {
    renderSheet({ showCancelAction: false, showRescheduleAction: false });
    expect(screen.queryByLabelText('Reschedule booking')).toBeNull();
    expect(screen.queryByLabelText('Cancel booking')).toBeNull();
    expect(screen.getByLabelText('Edit booking')).toBeTruthy();
    expect(screen.getByLabelText('Delete booking')).toBeTruthy();
    expect(screen.getAllByTestId('booking-action-row')).toHaveLength(1);
  });

  it('hides Job status when showJobStatusAction is false', () => {
    renderSheet({ showJobStatusAction: false });
    expect(screen.queryByLabelText('Job status')).toBeNull();
  });

  it('shows Delete in place of Complete and calls onDeleteBooking after close', () => {
    const onDeleteBooking = jest.fn();
    renderSheet({ showJobStatusAction: true, onDeleteBooking });
    expect(screen.queryByLabelText('Mark booking complete')).toBeNull();
    expect(screen.getAllByTestId('booking-action-row')).toHaveLength(2);
    const remove = screen.getByLabelText('Delete booking');
    expect(remove).toBeTruthy();
    fireEvent.press(remove);
    jest.advanceTimersByTime(BOOKING_ACTIONS_HANDOFF_MS);
    expect(onDeleteBooking).toHaveBeenCalledTimes(1);
  });

  it('hides create-style writes and keeps Delete plus Job status', () => {
    renderSheet({ canWriteBookings: false, showJobStatusAction: true });
    expect(screen.getByLabelText('Job status')).toBeTruthy();
    expect(screen.getByLabelText('Delete booking')).toBeTruthy();
    expect(screen.queryByLabelText('Mark booking complete')).toBeNull();
    expect(screen.queryByLabelText('Edit booking')).toBeNull();
    expect(screen.queryByLabelText('Reschedule booking')).toBeNull();
    expect(screen.queryByLabelText('Cancel booking')).toBeNull();
  });

  it('hides Delete when the member cannot delete bookings', () => {
    renderSheet({ canDeleteBookings: false });
    expect(screen.queryByLabelText('Delete booking')).toBeNull();
    expect(screen.getByLabelText('Edit booking')).toBeTruthy();
  });
});
