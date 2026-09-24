import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../home/__tests__/testUtils';
import { BookingAssigneeSection } from '../BookingAssigneeSection';

const mockAssignees = {
  assignees: [
    { userId: 'owner-1', label: 'Owner', kind: 'owner' },
    { userId: 'mem-1', label: 'Sam Rivera', kind: 'member', email: 'sam@shop.com' },
  ],
  canAssign: true,
  pickerOptions: [
    { userId: null, label: 'Unassigned', kind: 'unassigned' },
    { userId: 'owner-1', label: 'Owner', kind: 'owner' },
    { userId: 'mem-1', label: 'Sam Rivera', kind: 'member', email: 'sam@shop.com' },
  ],
  labelFor: (id) => (id === 'mem-1' ? 'Sam Rivera' : id === 'owner-1' ? 'Owner' : null),
  isLoading: false,
};

const mockAssignBooking = jest.fn();
const mockResetAssignError = jest.fn();
const mockPatch = {
  assignBooking: (...args) => mockAssignBooking(...args),
  isAssigning: false,
  assignError: null,
  resetAssignError: mockResetAssignError,
};

jest.mock('../../hooks/useBookingAssignees', () => ({
  useBookingAssignees: () => mockAssignees,
}));

jest.mock('../../hooks/usePatchBookingAssignee', () => ({
  usePatchBookingAssignee: () => mockPatch,
}));

describe('BookingAssigneeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssignees.canAssign = true;
    mockAssignees.labelFor = (id) =>
      id === 'mem-1' ? 'Sam Rivera' : id === 'owner-1' ? 'Owner' : null;
    mockPatch.isAssigning = false;
    mockPatch.assignError = null;
    mockAssignBooking.mockResolvedValue({ assignedUserId: 'mem-1' });
  });

  it('saves the picked assignee and closes the sheet', async () => {
    renderWithProviders(
      <BookingAssigneeSection assignedUserId={null} bookingId="book-1" bookingStatus="confirmed" />,
    );

    expect(screen.getByText('Unassigned')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Change assignee'));
    fireEvent.press(screen.getByLabelText('Sam Rivera, sam@shop.com'));

    await waitFor(() => {
      expect(mockAssignBooking).toHaveBeenCalledWith('mem-1');
    });
    await waitFor(() => {
      expect(screen.queryByLabelText('Sam Rivera, sam@shop.com')).toBeNull();
    });
  });

  it('does not call the server when the same assignee is picked', async () => {
    renderWithProviders(
      <BookingAssigneeSection
        assignedUserId="mem-1"
        bookingId="book-1"
        bookingStatus="confirmed"
      />,
    );

    fireEvent.press(screen.getByLabelText('Change assignee'));
    fireEvent.press(screen.getByLabelText('Sam Rivera, sam@shop.com'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Sam Rivera, sam@shop.com')).toBeNull();
    });
    expect(mockAssignBooking).not.toHaveBeenCalled();
  });

  it('shows echo bars while the assignee is saving', () => {
    mockPatch.isAssigning = true;
    renderWithProviders(
      <BookingAssigneeSection assignedUserId={null} bookingId="book-1" bookingStatus="confirmed" />,
    );

    fireEvent.press(screen.getByLabelText('Change assignee'));
    expect(screen.getByLabelText('Assigning job')).toBeTruthy();
    expect(screen.getByText('Assigning job')).toBeTruthy();
  });

  it('does not open the picker on a completed booking', () => {
    renderWithProviders(
      <BookingAssigneeSection
        assignedUserId="mem-1"
        bookingId="book-1"
        bookingStatus="completed"
      />,
    );

    expect(screen.getByText('Sam Rivera')).toBeTruthy();
    expect(screen.queryByLabelText('Change assignee')).toBeNull();
  });

  it('hides the section for a solo shop with no assignee', () => {
    mockAssignees.canAssign = false;
    mockAssignees.labelFor = () => null;
    renderWithProviders(
      <BookingAssigneeSection assignedUserId={null} bookingId="book-1" bookingStatus="confirmed" />,
    );
    expect(screen.queryByText('Assignee')).toBeNull();
  });

  it('still shows a removed teammate on the job as read-only', () => {
    mockAssignees.canAssign = false;
    mockAssignees.labelFor = (id) => (id === 'old-1' ? 'Alex' : null);
    renderWithProviders(
      <BookingAssigneeSection
        assignedUserId="old-1"
        bookingId="book-1"
        bookingStatus="completed"
      />,
    );
    expect(screen.getByText('Alex')).toBeTruthy();
    expect(screen.queryByLabelText('Change assignee')).toBeNull();
  });
});
