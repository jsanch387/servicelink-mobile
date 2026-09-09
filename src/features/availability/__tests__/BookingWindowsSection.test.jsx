import { fireEvent, screen } from '@testing-library/react-native';
import { BookingWindowsSection } from '../components/BookingWindowsSection';
import { renderWithProviders } from '../../home/__tests__/testUtils';

describe('BookingWindowsSection', () => {
  it('renders lead time and buffer time cards with hints and values', () => {
    renderWithProviders(
      <BookingWindowsSection
        bufferTime="none"
        leadTime="none"
        onBufferTimeChange={jest.fn()}
        onLeadTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Booking timing')).toBeTruthy();
    expect(screen.getByText('Lead time')).toBeTruthy();
    expect(screen.getByText('How far ahead customers have to book.')).toBeTruthy();
    expect(screen.getByText('No lead time')).toBeTruthy();
    expect(screen.getByText('Buffer time')).toBeTruthy();
    expect(screen.getByText('A gap between your appointments.')).toBeTruthy();
    expect(screen.getByText('No buffer time')).toBeTruthy();
  });

  it('opens the lead time explainer from the info icon', () => {
    renderWithProviders(
      <BookingWindowsSection
        bufferTime="none"
        leadTime="24h"
        onBufferTimeChange={jest.fn()}
        onLeadTimeChange={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText('About lead time'));

    expect(screen.getByText('How lead time works')).toBeTruthy();
    expect(screen.getByText('No same-day bookings')).toBeTruthy();
    expect(
      screen.getByText(
        'Set lead time to 1 day if you do not take same-day appointments. Customers can only pick tomorrow or later.',
      ),
    ).toBeTruthy();
  });

  it('reports the stored buffer token when the picker changes', () => {
    const onBufferTimeChange = jest.fn();
    renderWithProviders(
      <BookingWindowsSection
        bufferTime="30m"
        leadTime="none"
        onBufferTimeChange={onBufferTimeChange}
        onLeadTimeChange={jest.fn()}
      />,
    );

    expect(screen.getByText('30 min')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Buffer time, currently 30 min'));
    const picker = screen.UNSAFE_getAllByType(require('@react-native-picker/picker').Picker)[0];
    fireEvent(picker, 'valueChange', '1h');
    expect(onBufferTimeChange).toHaveBeenCalledWith('1h');
  });

  it('opens the buffer time explainer from the info icon', () => {
    renderWithProviders(
      <BookingWindowsSection
        bufferTime="none"
        leadTime="none"
        onBufferTimeChange={jest.fn()}
        onLeadTimeChange={jest.fn()}
      />,
    );

    fireEvent.press(screen.getByLabelText('About buffer time'));

    expect(screen.getByText('How buffer time works')).toBeTruthy();
    expect(screen.getByText('A 9:00 example')).toBeTruthy();
    expect(
      screen.getByText(
        'A 9:00 appointment that lasts an hour ends at 10:00. With a 30-minute buffer, customers cannot book 10:00 — the next open time is 10:30.',
      ),
    ).toBeTruthy();
  });
});
