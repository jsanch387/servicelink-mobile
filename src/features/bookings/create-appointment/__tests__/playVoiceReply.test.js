import * as Speech from 'expo-speech';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { parseSpeakAudio } from '../voice/parseSpeakAudio';
import { playVoiceReply, stopVoiceReply } from '../voice/playVoiceReply';

const mockPlayer = {
  play: jest.fn(),
  pause: jest.fn(),
  remove: jest.fn(),
};

jest.mock('expo-speech', () => ({
  speak: jest.fn(),
  stop: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => mockPlayer),
  setAudioModeAsync: jest.fn(async () => {}),
}));

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///tmp/',
  EncodingType: { Base64: 'base64' },
  writeAsStringAsync: jest.fn(async () => {}),
}));

describe('parseSpeakAudio', () => {
  it('returns null when the payload is missing or not MPEG', () => {
    expect(parseSpeakAudio(null)).toBeNull();
    expect(parseSpeakAudio({ base64: 'abc', mimeType: 'audio/wav' })).toBeNull();
    expect(parseSpeakAudio({ mimeType: 'audio/mpeg' })).toBeNull();
  });

  it('accepts audio/mpeg and audio/mp3', () => {
    expect(parseSpeakAudio({ base64: 'YWJj', mimeType: 'audio/mpeg' })).toEqual({
      base64: 'YWJj',
      mimeType: 'audio/mpeg',
    });
    expect(parseSpeakAudio({ base64: ' YWJj ', mimeType: 'audio/mp3' })).toEqual({
      base64: 'YWJj',
      mimeType: 'audio/mpeg',
    });
  });
});

describe('playVoiceReply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPlayer.play.mockClear();
    mockPlayer.pause.mockClear();
    mockPlayer.remove.mockClear();
  });

  it('plays MPEG speakAudio and does not call device TTS', async () => {
    const path = await playVoiceReply({
      speak: 'Got the audio. AI comes next.',
      speakAudio: { base64: 'ZmFrZQ==', mimeType: 'audio/mpeg' },
    });

    expect(path).toBe('cloud');
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      'file:///tmp/voice-speak.mp3',
      'ZmFrZQ==',
      { encoding: 'base64' },
    );
    expect(setAudioModeAsync).toHaveBeenCalledWith({
      allowsRecording: false,
      playsInSilentMode: true,
    });
    expect(createAudioPlayer).toHaveBeenCalledWith({ uri: 'file:///tmp/voice-speak.mp3' });
    expect(mockPlayer.play).toHaveBeenCalled();
    expect(Speech.speak).not.toHaveBeenCalled();
  });

  it('falls back to expo-speech when speakAudio is missing', async () => {
    const path = await playVoiceReply({
      speak: 'Got the audio. AI comes next.',
      speakAudio: null,
    });

    expect(path).toBe('device');
    expect(createAudioPlayer).not.toHaveBeenCalled();
    expect(Speech.speak).toHaveBeenCalledWith('Got the audio. AI comes next.');
  });

  it('falls back to expo-speech when cloud playback fails', async () => {
    FileSystem.writeAsStringAsync.mockRejectedValueOnce(new Error('disk'));

    const path = await playVoiceReply({
      speak: 'What’s the phone number?',
      speakAudio: { base64: 'ZmFrZQ==', mimeType: 'audio/mpeg' },
    });

    expect(path).toBe('device');
    expect(Speech.speak).toHaveBeenCalledWith('What’s the phone number?');
  });
});

describe('stopVoiceReply', () => {
  it('stops device TTS and releases the player', async () => {
    await playVoiceReply({
      speak: 'Hi',
      speakAudio: { base64: 'ZmFrZQ==', mimeType: 'audio/mpeg' },
    });
    stopVoiceReply();

    expect(Speech.stop).toHaveBeenCalled();
    expect(mockPlayer.pause).toHaveBeenCalled();
    expect(mockPlayer.remove).toHaveBeenCalled();
  });
});
