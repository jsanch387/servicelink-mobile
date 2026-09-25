import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { OWNER_OVERLAP_SAME_TIME_PICKER } from '../../constants/ownerBookingOverlapCopy';
import { ScheduleStep } from '../steps/ScheduleStep';

function renderStep(ui) {
  return render(
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>{ui}</TypographyProvider>
    </ThemeProvider>,
  );
}

jest.mock('../../../availability/booking', () => {
  const { View, Text } = require('react-native');
  return {
    BookingDateTimePicker: ({ belowCalendar, belowTimes }) => (
      <View>
        <Text>Calendar</Text>
        {belowCalendar}
        <Text>Choose time</Text>
        {belowTimes}
      </View>
    ),
  };
});

describe('ScheduleStep', () => {
  const pickerProps = {
    selectedDateKey: '2026-04-29',
    selectedTime: '10:00 AM',
    timeSlots: ['10:00 AM', '11:00 AM'],
    onSelectDateKey: jest.fn(),
    onSelectTime: jest.fn(),
  };

  it('shows the same-time heads-up under the calendar', () => {
    renderStep(
      <ScheduleStep
        {...pickerProps}
        blockingBookingRows={[{ id: 'a', scheduled_date: '2026-04-29', start_time: '10:00:00' }]}
      />,
    );

    expect(screen.getByText(OWNER_OVERLAP_SAME_TIME_PICKER)).toBeTruthy();
    const notice = screen.getByText(OWNER_OVERLAP_SAME_TIME_PICKER);
    const calendar = screen.getByText('Calendar');
    const chooseTime = screen.getByText('Choose time');
    expect(calendar).toBeTruthy();
    expect(chooseTime).toBeTruthy();
    expect(notice).toBeTruthy();
  });

  it('stays quiet when the start time is free', () => {
    renderStep(
      <ScheduleStep
        {...pickerProps}
        selectedTime="11:00 AM"
        blockingBookingRows={[{ id: 'a', scheduled_date: '2026-04-29', start_time: '10:00:00' }]}
      />,
    );

    expect(screen.queryByText(OWNER_OVERLAP_SAME_TIME_PICKER)).toBeNull();
  });
});
