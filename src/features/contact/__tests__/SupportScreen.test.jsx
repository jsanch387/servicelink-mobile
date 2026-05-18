import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../home/__tests__/testUtils';
import { SupportScreen } from '../screens/SupportScreen';
import { postContactForm } from '../api/postContactForm';

jest.mock('../../auth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      email: 'owner@example.com',
      user_metadata: { full_name: 'Alex Rivera' },
    },
  })),
}));

jest.mock('../api/postContactForm', () => ({
  postContactForm: jest.fn(),
}));

const mockPostContactForm = postContactForm;

describe('SupportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the contact form', () => {
    renderWithProviders(<SupportScreen />);
    expect(screen.getByText('Send message')).toBeTruthy();
    expect(screen.getByText('Topic')).toBeTruthy();
    expect(screen.getByText('Message')).toBeTruthy();
  });

  it('shows validation error for a short message', () => {
    renderWithProviders(<SupportScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Describe your request (at least 10 characters)'),
      'short',
    );
    fireEvent.press(screen.getByText('Send message'));
    expect(screen.getByText('Message must be at least 10 characters.')).toBeTruthy();
    expect(mockPostContactForm).not.toHaveBeenCalled();
  });

  it('shows success after a successful submit', async () => {
    mockPostContactForm.mockResolvedValue({ ok: true });
    renderWithProviders(<SupportScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Describe your request (at least 10 characters)'),
      'The bookings list does not refresh after approving a quote.',
    );
    fireEvent.press(screen.getByText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Message sent')).toBeTruthy();
    });
    expect(
      screen.getByText('Thanks for reaching out. We usually respond within 24 hours.'),
    ).toBeTruthy();
    expect(mockPostContactForm).toHaveBeenCalledWith({
      name: 'Alex Rivera',
      email: 'owner@example.com',
      topic: 'bug_report',
      message: 'The bookings list does not refresh after approving a quote.',
    });
  });

  it('shows error screen when submit fails', async () => {
    mockPostContactForm.mockResolvedValue({
      ok: false,
      error: 'Too many submissions.',
      httpStatus: 429,
    });
    renderWithProviders(<SupportScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Describe your request (at least 10 characters)'),
      'The bookings list does not refresh after approving a quote.',
    );
    fireEvent.press(screen.getByText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Couldn’t send')).toBeTruthy();
    });
    expect(screen.getByText('Too many submissions.')).toBeTruthy();
  });
});
