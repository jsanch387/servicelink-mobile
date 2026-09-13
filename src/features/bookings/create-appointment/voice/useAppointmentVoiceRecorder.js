import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import {
  VOICE_MAX_CLIP_MS,
  VOICE_SILENCE_MS,
  VOICE_SPEECH_METERING_DB,
} from './appointmentVoiceDemo';

const METER_POLL_MS = 250;

function formatClipSeconds(durationMillis) {
  return `${Math.max(0, durationMillis / 1000).toFixed(1)}s`;
}

/**
 * Records one utterance for the voice orb. Hold/latch stay in the session;
 * this hook starts/stops the mic and returns the clip when listening ends.
 */
export function useAppointmentVoiceRecorder({ active = true, latched = false, onClip } = {}) {
  const recorder = useAudioRecorder({
    ...RecordingPresets.HIGH_QUALITY,
    isMeteringEnabled: true,
    numberOfChannels: 1,
  });
  const recorderState = useAudioRecorderState(recorder, METER_POLL_MS);
  const [error, setError] = useState(null);
  const [lastClip, setLastClip] = useState(null);
  const startingRef = useRef(false);
  const stopAfterStartRef = useRef(false);
  const finishingRef = useRef(false);
  const heardSpeechRef = useRef(false);
  const silenceMsRef = useRef(0);
  const startedAtRef = useRef(0);
  const durationRef = useRef(0);
  const onClipRef = useRef(onClip);
  onClipRef.current = onClip;

  durationRef.current = recorderState.isRecording
    ? recorderState.durationMillis
    : durationRef.current;

  const finishClip = useCallback(async () => {
    if (finishingRef.current) {
      return null;
    }
    if (startingRef.current) {
      stopAfterStartRef.current = true;
      return null;
    }
    if (!recorder.isRecording) {
      return null;
    }
    finishingRef.current = true;
    heardSpeechRef.current = false;
    silenceMsRef.current = 0;
    try {
      const live = recorder.getStatus?.() ?? {};
      const elapsedMs = startedAtRef.current ? Date.now() - startedAtRef.current : 0;
      const durationMillis = Math.round(
        Number(live.durationMillis) ||
          durationRef.current ||
          Number(recorder.currentTime) * 1000 ||
          elapsedMs ||
          0,
      );
      await recorder.stop();
      const uri = recorder.uri;
      const clip = uri ? { uri, durationMillis } : null;
      setLastClip(clip);
      if (clip) {
        onClipRef.current?.(clip);
      }
      return clip;
    } catch {
      setError('Could not finish that recording.');
      return null;
    } finally {
      finishingRef.current = false;
      startedAtRef.current = 0;
    }
  }, [recorder]);

  const startListen = useCallback(async () => {
    if (startingRef.current || recorder.isRecording || finishingRef.current) {
      return false;
    }
    startingRef.current = true;
    stopAfterStartRef.current = false;
    heardSpeechRef.current = false;
    silenceMsRef.current = 0;
    setError(null);
    setLastClip(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone access is needed to talk.');
        return false;
      }
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      startedAtRef.current = Date.now();
      durationRef.current = 0;
      if (stopAfterStartRef.current) {
        stopAfterStartRef.current = false;
        await finishClip();
        return false;
      }
      return true;
    } catch {
      setError('Could not start the microphone.');
      return false;
    } finally {
      startingRef.current = false;
    }
  }, [finishClip, recorder]);

  useEffect(() => {
    if (!active) {
      if (recorder.isRecording) {
        void finishClip();
      }
    }
  }, [active, finishClip, recorder.isRecording]);

  useEffect(() => {
    if (!active || !latched || !recorderState.isRecording) {
      return;
    }
    if (recorderState.durationMillis >= VOICE_MAX_CLIP_MS) {
      void finishClip();
      return;
    }
    const metering = recorderState.metering;
    if (metering != null && metering > VOICE_SPEECH_METERING_DB) {
      heardSpeechRef.current = true;
      silenceMsRef.current = 0;
      return;
    }
    if (!heardSpeechRef.current) {
      return;
    }
    silenceMsRef.current += METER_POLL_MS;
    if (silenceMsRef.current >= VOICE_SILENCE_MS) {
      void finishClip();
    }
  }, [
    active,
    finishClip,
    latched,
    recorderState.durationMillis,
    recorderState.isRecording,
    recorderState.metering,
  ]);

  const caption = error
    ? error
    : lastClip
      ? `Recorded ${formatClipSeconds(lastClip.durationMillis)}`
      : null;

  return {
    caption,
    error,
    finishClip,
    lastClip,
    startListen,
  };
}
