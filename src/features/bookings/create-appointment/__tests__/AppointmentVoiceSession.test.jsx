import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { AppointmentVoiceHost } from '../voice/AppointmentVoiceHost';
import { AppointmentVoiceSession } from '../voice/AppointmentVoiceSession';
import { formatScheduledDateUserFacing } from '../../../quotes/utils/formatScheduledDateDisplay';
import {
  LAST_VOICE_TURN_INDEX,
  VOICE_HOLD_MS,
  VOICE_LISTEN_MS,
} from '../voice/appointmentVoiceDemo';

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

function renderSession(props) {
  return render(wrap(<AppointmentVoiceSession {...props} />));
}

function tapToListen() {
  fireEvent.press(screen.getByTestId('appointment-voice-talk'));
}

function advanceListen() {
  act(() => {
    jest.advanceTimersByTime(VOICE_LISTEN_MS);
  });
}

describe('AppointmentVoiceSession', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('closes from the header Close control', () => {
    const onRequestClose = jest.fn();
    renderSession({ visible: true, onRequestClose });

    fireEvent.press(screen.getByTestId('appointment-voice-close'));
    expect(onRequestClose).toHaveBeenCalled();
  });

  it('keeps listening after a tap', () => {
    renderSession({ visible: true, onRequestClose: jest.fn() });

    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
    tapToListen();

    expect(screen.getByText('Listening… Tap to stop')).toBeTruthy();
    expect(screen.queryByText('Customer')).toBeNull();

    advanceListen();

    expect(screen.getByText('What’s the phone number and vehicle?')).toBeTruthy();
    expect(screen.getByText('Listening… Tap to stop')).toBeTruthy();
    expect(screen.queryByText('Jose')).toBeNull();
  });

  it('sends one turn on hold-and-release and does not stay listening', () => {
    renderSession({ visible: true, onRequestClose: jest.fn() });

    const orb = screen.getByTestId('appointment-voice-talk');
    fireEvent(orb, 'pressIn');
    act(() => {
      jest.advanceTimersByTime(VOICE_HOLD_MS);
    });
    fireEvent(orb, 'pressOut');

    expect(screen.getByText('What’s the phone number and vehicle?')).toBeTruthy();
    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
    expect(screen.queryByText('Review')).toBeNull();
  });

  it('opens review after a latched conversation so the user can edit and submit', () => {
    const onSubmit = jest.fn();
    renderSession({ visible: true, onRequestClose: jest.fn(), onSubmit });

    tapToListen();
    for (let step = 0; step < LAST_VOICE_TURN_INDEX; step += 1) {
      advanceListen();
    }

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
    fireEvent.press(screen.getByTestId('appointment-voice-submit'));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ customer: 'Jose M.' }));
  });

  it('resets the script when the session is closed', () => {
    const { rerender } = renderSession({ visible: true, onRequestClose: jest.fn() });

    tapToListen();
    advanceListen();
    expect(screen.getByText('What’s the phone number and vehicle?')).toBeTruthy();

    rerender(wrap(<AppointmentVoiceSession visible={false} onRequestClose={jest.fn()} />));
    rerender(wrap(<AppointmentVoiceSession visible onRequestClose={jest.fn()} />));

    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
    expect(screen.queryByText('What’s the phone number and vehicle?')).toBeNull();
  });
});

describe('AppointmentVoiceHost', () => {
  it('opens the voice window from the orb', () => {
    render(wrap(<AppointmentVoiceHost />));

    expect(screen.getByText('Tap to speak')).toBeTruthy();
    expect(screen.queryByTestId('appointment-voice-talk')).toBeNull();
    fireEvent.press(screen.getByTestId('appointment-voice-orb'));
    expect(screen.getByTestId('appointment-voice-talk')).toBeTruthy();
    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
  });
});
