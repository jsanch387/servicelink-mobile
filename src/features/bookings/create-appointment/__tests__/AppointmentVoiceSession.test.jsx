import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, TypographyProvider } from '../../../../theme';
import { AppointmentVoiceHost } from '../voice/AppointmentVoiceHost';
import { AppointmentVoiceSession } from '../voice/AppointmentVoiceSession';
import { VOICE_HOLD_MS } from '../voice/appointmentVoiceDemo';
import { postVoiceTurn } from '../voice/api/postVoiceTurn';
import { playVoiceReply } from '../voice/playVoiceReply';

jest.mock('../../../auth', () => ({
  useAuth: () => ({ session: { access_token: 'test-token' } }),
}));

jest.mock('../voice/playVoiceReply', () => ({
  playVoiceReply: jest.fn(async () => 'device'),
  stopVoiceReply: jest.fn(),
}));

jest.mock('../voice/api/postVoiceTurn', () => ({
  postVoiceTurn: jest.fn(async () => ({
    ok: true,
    data: {
      transcript: '(server got the clip)',
      draft: {},
      ask: 'Got the audio. AI comes next.',
      speak: 'Got the audio. AI comes next.',
      speakAudio: null,
      ready: false,
    },
  })),
}));

jest.mock('expo-audio', () => {
  const recorder = {
    isRecording: false,
    uri: 'file:///tmp/voice-clip.m4a',
    currentTime: 1.4,
    prepareToRecordAsync: jest.fn(async () => {}),
    record: jest.fn(() => {
      recorder.isRecording = true;
    }),
    stop: jest.fn(async () => {
      recorder.isRecording = false;
    }),
    getStatus: jest.fn(() => ({ durationMillis: 1400, isRecording: false })),
  };
  return {
    __recorder: recorder,
    RecordingPresets: { HIGH_QUALITY: { extension: '.m4a' } },
    useAudioRecorder: () => recorder,
    useAudioRecorderState: () => ({
      isRecording: recorder.isRecording,
      durationMillis: recorder.isRecording ? 1400 : 0,
      metering: undefined,
    }),
    requestRecordingPermissionsAsync: jest.fn(async () => ({
      granted: true,
      status: 'granted',
    })),
    setAudioModeAsync: jest.fn(async () => {}),
  };
});

const { __recorder: recorder, requestRecordingPermissionsAsync } = jest.requireMock('expo-audio');

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

async function tapOrb() {
  const orb = screen.getByTestId('appointment-voice-talk');
  fireEvent(orb, 'pressIn');
  await flushAudio();
  fireEvent(orb, 'pressOut');
  fireEvent.press(orb);
}

async function flushAudio() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('AppointmentVoiceSession', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    recorder.isRecording = false;
    recorder.prepareToRecordAsync.mockClear();
    recorder.record.mockClear();
    recorder.stop.mockClear();
    requestRecordingPermissionsAsync.mockResolvedValue({ granted: true, status: 'granted' });
    postVoiceTurn.mockClear();
    playVoiceReply.mockClear();
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

  it('keeps the mic open after a tap and does not run the old script', async () => {
    renderSession({ visible: true, onRequestClose: jest.fn() });

    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
    await tapOrb();
    await flushAudio();

    expect(screen.getByText('Listening… Tap to stop')).toBeTruthy();
    expect(recorder.record).toHaveBeenCalled();
    expect(screen.queryByText('What’s the phone number and vehicle?')).toBeNull();
    expect(screen.queryByText('Review')).toBeNull();
  });

  it('sends one clip on hold-and-release and does not stay listening', async () => {
    const onClip = jest.fn();
    renderSession({
      visible: true,
      accessToken: 'test-token',
      onRequestClose: jest.fn(),
      onClip,
    });

    const orb = screen.getByTestId('appointment-voice-talk');
    fireEvent(orb, 'pressIn');
    await flushAudio();
    act(() => {
      jest.advanceTimersByTime(VOICE_HOLD_MS);
    });
    fireEvent(orb, 'pressOut');
    await flushAudio();

    expect(recorder.stop).toHaveBeenCalled();
    expect(onClip).toHaveBeenCalledWith({
      uri: 'file:///tmp/voice-clip.m4a',
      durationMillis: 1400,
    });
    expect(postVoiceTurn).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({ uri: 'file:///tmp/voice-clip.m4a' }),
    );
    expect(screen.getByText('Got the audio. AI comes next.')).toBeTruthy();
    expect(screen.getByText('(server got the clip)')).toBeTruthy();
    expect(playVoiceReply).toHaveBeenCalledWith({
      speak: 'Got the audio. AI comes next.',
      speakAudio: null,
    });
    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
    expect(screen.queryByText('Review')).toBeNull();
  });

  it('passes server speakAudio through to the reply player', async () => {
    postVoiceTurn.mockResolvedValueOnce({
      ok: true,
      data: {
        transcript: '(server got the clip)',
        draft: {},
        ask: 'Got the audio. AI comes next.',
        speak: 'Got the audio. AI comes next.',
        speakAudio: { base64: 'ZmFrZQ==', mimeType: 'audio/mpeg' },
        ready: false,
      },
    });

    renderSession({
      visible: true,
      accessToken: 'test-token',
      onRequestClose: jest.fn(),
    });

    const orb = screen.getByTestId('appointment-voice-talk');
    fireEvent(orb, 'pressIn');
    await flushAudio();
    act(() => {
      jest.advanceTimersByTime(VOICE_HOLD_MS);
    });
    fireEvent(orb, 'pressOut');
    await flushAudio();

    expect(playVoiceReply).toHaveBeenCalledWith({
      speak: 'Got the audio. AI comes next.',
      speakAudio: { base64: 'ZmFrZQ==', mimeType: 'audio/mpeg' },
    });
  });

  it('stops a latched listen on the next tap', async () => {
    const onClip = jest.fn();
    renderSession({ visible: true, onRequestClose: jest.fn(), onClip });

    await tapOrb();
    await flushAudio();
    expect(screen.getByText('Listening… Tap to stop')).toBeTruthy();

    await tapOrb();
    await flushAudio();

    expect(onClip).toHaveBeenCalled();
    expect(screen.getByText('Got the audio. AI comes next.')).toBeTruthy();
    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
  });

  it('resets listening when the session is closed', async () => {
    const { rerender } = renderSession({ visible: true, onRequestClose: jest.fn() });

    await tapOrb();
    await flushAudio();
    expect(screen.getByText('Listening… Tap to stop')).toBeTruthy();

    rerender(wrap(<AppointmentVoiceSession visible={false} onRequestClose={jest.fn()} />));
    await flushAudio();
    rerender(wrap(<AppointmentVoiceSession visible onRequestClose={jest.fn()} />));

    expect(screen.getByText('Tap to keep listening · Hold to talk')).toBeTruthy();
    expect(screen.queryByText('Listening… Tap to stop')).toBeNull();
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
