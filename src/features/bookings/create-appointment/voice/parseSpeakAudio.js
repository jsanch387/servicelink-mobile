const MPEG_TYPES = new Set(['audio/mpeg', 'audio/mp3']);

/**
 * Server TTS payload: MPEG base64, or null if missing / not playable.
 */
export function parseSpeakAudio(raw) {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const base64 = String(raw.base64 ?? '').replace(/\s/g, '');
  const mimeType = String(raw.mimeType ?? '').trim().toLowerCase();
  if (!base64 || !MPEG_TYPES.has(mimeType)) {
    return null;
  }
  return { base64, mimeType: 'audio/mpeg' };
}
