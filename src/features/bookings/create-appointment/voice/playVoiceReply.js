import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Speech from 'expo-speech';
import { parseSpeakAudio } from './parseSpeakAudio';

export { parseSpeakAudio };

let player = null;

export function stopVoiceReply() {
  Speech.stop();
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // Player may already be released.
    }
    player = null;
  }
}

async function writeSpeakFile(base64) {
  const path = `${FileSystem.cacheDirectory}voice-speak.mp3`;
  await FileSystem.writeAsStringAsync(path, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return path;
}

/**
 * Play server TTS when `speakAudio` is a MPEG base64 payload.
 * Otherwise fall back to on-device `expo-speech` using `speak`.
 */
export async function playVoiceReply({ speak, speakAudio } = {}) {
  stopVoiceReply();
  const audio = parseSpeakAudio(speakAudio);
  if (audio) {
    try {
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      const uri = await writeSpeakFile(audio.base64);
      player = createAudioPlayer({ uri });
      player.play();
      return 'cloud';
    } catch {
      // Fall through to device TTS.
    }
  }
  const line = String(speak ?? '').trim();
  if (line) {
    Speech.speak(line);
    return 'device';
  }
  return null;
}
