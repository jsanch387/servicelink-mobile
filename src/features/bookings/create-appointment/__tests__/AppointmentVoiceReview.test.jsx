import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { formatScheduledDateUserFacing } from '../../../quotes/utils/formatScheduledDateDisplay';
import { AppointmentVoiceReview } from '../voice/AppointmentVoiceReview';
import { LAST_VOICE_TURN_INDEX, voiceTurnAt } from '../voice/appointmentVoiceDemo';

const initialMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

function wrap(ui) {
  return (
    <ThemeProvider initialScheme="dark">
      <TypographyProvider>
        <SafeAreaProvider initialMetrics={initialMetrics}>{ui}</SafeAreaProvider>
      </TypographyProvider>
    </ThemeProvider>
  );
}

describe('AppointmentVoiceReview', () => {
  it('shows the constructed draft and lets the user edit then submit', () => {
    const onSubmit = jest.fn();
    const onChangeField = jest.fn();
    const draft = { ...voiceTurnAt(LAST_VOICE_TURN_INDEX).slots };

    render(
      wrap(
        <AppointmentVoiceReview draft={draft} onChangeField={onChangeField} onSubmit={onSubmit} />,
      ),
    );

    expect(screen.getByText('Review')).toBeTruthy();
    expect(screen.getByText('Summary')).toBeTruthy();
    expect(screen.getByText('Full detail')).toBeTruthy();
    expect(screen.getAllByText('$89').length).toBeGreaterThan(0);
    expect(screen.getByText('Sedan')).toBeTruthy();
    expect(screen.getByText('Ceramic coat')).toBeTruthy();
    expect(screen.getByText('$149')).toBeTruthy();
    expect(screen.getByText('$238')).toBeTruthy();
    expect(screen.getByText('Schedule')).toBeTruthy();
    expect(screen.getByText(formatScheduledDateUserFacing('2026-09-10'))).toBeTruthy();
    expect(screen.getByText('10:00 AM')).toBeTruthy();
    expect(screen.getByText('Jose')).toBeTruthy();
    expect(screen.getByText('+1 (512) 321-4324')).toBeTruthy();
    expect(screen.getByText('2019 Honda Accord')).toBeTruthy();
    expect(screen.getByText('412 Oak Street')).toBeTruthy();
    expect(screen.getAllByText('Edit').length).toBeGreaterThan(0);
    expect(screen.queryByText('Notes')).toBeNull();
    expect(screen.getByText('Total')).toBeTruthy();

    fireEvent.press(screen.getByTestId('voice-review-vehicle-edit'));
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByDisplayValue('2019')).toBeTruthy();
    expect(screen.getByDisplayValue('Honda')).toBeTruthy();
    expect(screen.getByDisplayValue('Accord')).toBeTruthy();
    fireEvent.press(screen.getByText('Done'));
    expect(screen.queryByTestId('voice-review-vehicleYear-input')).toBeNull();

    fireEvent.press(screen.getByTestId('voice-review-customer'));
    fireEvent.changeText(screen.getByTestId('voice-review-customer-input'), 'Jose M.');
    expect(onChangeField).toHaveBeenCalledWith('customer', 'Jose M.');
    fireEvent.press(screen.getByTestId('appointment-voice-submit'));
    expect(onSubmit).toHaveBeenCalled();
  });
});
