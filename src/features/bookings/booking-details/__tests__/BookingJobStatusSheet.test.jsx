import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { JOB_STATUS } from '../../constants/jobStatus';
import { useBookingAction } from '../../hooks/useBookingAction';
import { BookingJobStatusSheet } from '../components/BookingJobStatusSheet';

jest.mock('../../hooks/useBookingAction', () => ({
  useBookingAction: jest.fn(),
}));

const notifyOnTheWay = jest.fn();
const startJobAsync = jest.fn();
const workFinished = jest.fn();

function renderSheet(props = {}) {
  return renderWithProviders(
    <BookingJobStatusSheet
      bookingId="book-1"
      businessId="biz-1"
      jobStatus={JOB_STATUS.NOT_STARTED}
      visible
      workHandoffStatus={null}
      onRequestClose={() => {}}
      {...props}
    />,
  );
}

describe('BookingJobStatusSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notifyOnTheWay.mockResolvedValue({
      ok: true,
      smsSent: true,
      jobStatus: JOB_STATUS.ON_THE_WAY,
      workHandoffStatus: null,
    });
    startJobAsync.mockResolvedValue({
      ok: true,
      smsSent: true,
      jobStatus: JOB_STATUS.IN_PROGRESS,
      workHandoffStatus: null,
    });
    workFinished.mockResolvedValue({
      ok: true,
      smsSent: true,
      jobStatus: JOB_STATUS.IN_PROGRESS,
      workHandoffStatus: 'notified',
    });
    useBookingAction.mockReturnValue({
      notifyOnTheWay,
      startJobAsync,
      workFinished,
      disabled: false,
      isSending: false,
    });
  });

  it('only exposes On my way as a button when not started', () => {
    renderSheet();
    expect(screen.getByRole('button', { name: 'On my way' })).toBeTruthy();
    expect(screen.getByText('Send on the way text')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Start job' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Work finished' })).toBeNull();
    expect(screen.getByText('Available after you mark on the way')).toBeTruthy();
  });

  it('only exposes Start job when on the way', () => {
    renderSheet({ jobStatus: JOB_STATUS.ON_THE_WAY });
    expect(screen.getByRole('button', { name: 'Start job' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'On my way' })).toBeNull();
    expect(screen.getByText('Already sent')).toBeTruthy();
  });

  it('locks earlier steps when Next Up already advanced the booking', () => {
    renderSheet({ jobStatus: JOB_STATUS.IN_PROGRESS, workHandoffStatus: null });
    expect(screen.queryByRole('button', { name: 'On my way' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Start job' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Work finished' })).toBeTruthy();
  });

  it('swaps content in the same sheet for the active action', () => {
    renderSheet();
    fireEvent.press(screen.getByRole('button', { name: 'On my way' }));
    expect(screen.getByText('Job status')).toBeTruthy();
    expect(screen.getByText('Let your customer know you are on the way.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Send' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'On my way' })).toBeNull();
  });

  it('sends on my way through the booking action API', async () => {
    renderSheet();
    fireEvent.press(screen.getByRole('button', { name: 'On my way' }));
    fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(notifyOnTheWay).toHaveBeenCalledWith('book-1', true, { suppressUiFeedback: true });
    });
  });

  it('labels On my way as Skipped after Skip', async () => {
    renderSheet();
    fireEvent.press(screen.getByRole('button', { name: 'On my way' }));
    fireEvent.press(screen.getByRole('button', { name: 'Skip' }));
    await waitFor(() => {
      expect(notifyOnTheWay).toHaveBeenCalledWith('book-1', false, { suppressUiFeedback: true });
    });
    await waitFor(() => {
      expect(screen.getByText('Skipped')).toBeTruthy();
    });
    expect(screen.queryByText('Already sent')).toBeNull();
  });

  it('labels Work finished as Skipped when handoff was skipped', () => {
    renderSheet({
      jobStatus: JOB_STATUS.IN_PROGRESS,
      workHandoffStatus: 'skipped',
    });
    expect(screen.getByText('Skipped')).toBeTruthy();
    expect(screen.queryByText('Already finished')).toBeNull();
  });

  it('shows an error and allows retry when send fails', async () => {
    notifyOnTheWay.mockResolvedValueOnce({
      ok: false,
      error: { message: 'Network error. Check your connection and try again.' },
    });
    renderSheet();
    fireEvent.press(screen.getByRole('button', { name: 'On my way' }));
    fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => {
      expect(screen.getByText('Network error. Check your connection and try again.')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Skip' })).toBeTruthy();
  });
});
