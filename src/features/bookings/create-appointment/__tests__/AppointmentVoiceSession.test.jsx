import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { AppointmentVoiceHost } from '../voice/AppointmentVoiceHost';
import { AppointmentVoiceSession } from '../voice/AppointmentVoiceSession';
import { LAST_VOICE_TURN_INDEX, VOICE_LISTEN_MS } from '../voice/appointmentVoiceDemo';

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

  it('opens on the first question and walks the demo conversation', () => {
    const onUseDetails = jest.fn();
    renderSession({ visible: true, onRequestClose: jest.fn(), onUseDetails });

    expect(screen.getByText('I’m listening.')).toBeTruthy();
    expect(screen.queryByText('Use these details')).toBeNull();

    fireEvent.press(screen.getByTestId('appointment-voice-talk'));
    act(() => {
      jest.advanceTimersByTime(VOICE_LISTEN_MS);
    });

    expect(screen.getByText('What vehicle, and what’s the address?')).toBeTruthy();
    expect(screen.getByText('Jose')).toBeTruthy();
    expect(screen.getByText('Tomorrow 3:30')).toBeTruthy();

    for (let step = 0; step < LAST_VOICE_TURN_INDEX - 1; step += 1) {
      fireEvent.press(screen.getByTestId('appointment-voice-talk'));
      act(() => {
        jest.advanceTimersByTime(VOICE_LISTEN_MS);
      });
    }

    expect(screen.getByText(/Ready — Jose tomorrow at 3:30/)).toBeTruthy();
    fireEvent.press(screen.getByTestId('appointment-voice-use-details'));
    expect(onUseDetails).toHaveBeenCalled();
  });

  it('resets the script when the session is closed', () => {
    const { rerender } = renderSession({ visible: true, onRequestClose: jest.fn() });

    fireEvent.press(screen.getByTestId('appointment-voice-talk'));
    act(() => {
      jest.advanceTimersByTime(VOICE_LISTEN_MS);
    });
    expect(screen.getByText('Jose')).toBeTruthy();

    rerender(wrap(<AppointmentVoiceSession visible={false} onRequestClose={jest.fn()} />));
    rerender(wrap(<AppointmentVoiceSession visible onRequestClose={jest.fn()} />));

    expect(screen.getByText('I’m listening.')).toBeTruthy();
    expect(screen.queryByText('Jose')).toBeNull();
  });
});

describe('AppointmentVoiceHost', () => {
  it('opens the voice window from the orb', () => {
    render(wrap(<AppointmentVoiceHost />));

    expect(screen.queryByText('Talk to book')).toBeNull();
    fireEvent.press(screen.getByTestId('appointment-voice-orb'));
    expect(screen.getByText('Talk to book')).toBeTruthy();
    expect(screen.getByText('I’m listening.')).toBeTruthy();
  });
});
