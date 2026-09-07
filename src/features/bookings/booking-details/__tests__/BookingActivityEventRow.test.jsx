import { screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../../home/__tests__/testUtils';
import { BookingActivityEventRow } from '../components/BookingActivityEventRow';

function reminderEvent(overrides = {}) {
  return {
    key: 'reminder-sms',
    icon: 'alarm',
    title: 'Reminder',
    channel: 'text',
    outcome: 'sent',
    at: '2026-09-02T22:33:00Z',
    whenLabel: 'Sep 2 · 5:33 PM',
    optedOut: false,
    statusLine: 'Sent · Sep 2 · 5:33 PM',
    ...overrides,
  };
}

describe('BookingActivityEventRow', () => {
  it('keeps update type and status on the first line, channel and time below', () => {
    renderWithProviders(<BookingActivityEventRow isLast event={reminderEvent()} />);

    expect(screen.getByText('Reminder')).toBeTruthy();
    expect(screen.getByText('Sent')).toBeTruthy();
    expect(screen.getByText('Text')).toBeTruthy();
    expect(screen.getByText('Sep 2 · 5:33 PM')).toBeTruthy();
    expect(screen.queryByText('Text · Sep 2 · 5:33 PM')).toBeNull();
  });

  it('shows failed status and opted-out on the channel line', () => {
    renderWithProviders(
      <BookingActivityEventRow
        isLast
        event={reminderEvent({
          outcome: 'failed',
          optedOut: true,
          statusLine: "Didn't send · they opted out · Sep 2 · 5:33 PM",
        })}
      />,
    );

    expect(screen.getByText("Didn't send")).toBeTruthy();
    expect(screen.getByText('Text · opted out')).toBeTruthy();
  });
});
