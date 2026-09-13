import { productionWebApiHttpsGuard } from '../../../../../lib/productionWebApiHttpsGuard';
import { resolveStripeMobileCheckoutOrigin } from '../../../../../lib/stripeMobileCheckoutOrigin';
import { emptyVoiceReviewDraft } from '../appointmentVoiceDemo';
import { parseSpeakAudio } from '../parseSpeakAudio';

const VOICE_TURN_PATH = '/api/voice/turn';

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `voice-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function mapVoiceTurnHttpError(httpStatus, serverMessage) {
  const fallback = serverMessage?.trim() || null;
  if (httpStatus === 401) {
    return 'Sign in again to use voice booking.';
  }
  if (httpStatus === 403) {
    return fallback || 'Voice booking is only available for the business owner.';
  }
  if (httpStatus === 400) {
    return fallback || 'audio file is required';
  }
  if (httpStatus === 413) {
    return fallback || 'audio file is too large';
  }
  if (httpStatus === 0) {
    return fallback || 'Network error. Check your connection and try again.';
  }
  return fallback || `Could not send that clip (${httpStatus}).`;
}

export function mergeVoiceTurnDraft(partial) {
  const next = partial && typeof partial === 'object' ? partial : {};
  return {
    ...emptyVoiceReviewDraft(),
    ...next,
    addons: Array.isArray(next.addons) ? next.addons : [],
  };
}

function audioPart(uri) {
  const raw = String(uri ?? '').trim();
  const name = raw.split('/').pop()?.split('?')[0] || 'clip.m4a';
  const fileName = name.includes('.') ? name : `${name}.m4a`;
  return {
    uri: raw,
    name: fileName,
    type: 'audio/mp4',
  };
}

function readServerError(parsed) {
  if (typeof parsed?.error === 'string' && parsed.error.trim()) {
    return parsed.error.trim();
  }
  if (typeof parsed?.message === 'string' && parsed.message.trim()) {
    return parsed.message.trim();
  }
  return null;
}

/**
 * Owner voice turn: `POST /api/voice/turn` with multipart `audio` + `draft`.
 * Apply `{ transcript, draft, ask, speak, speakAudio, ready }` on 200.
 *
 * @param {string | null | undefined} accessToken
 * @param {{ uri: string; draft?: Record<string, unknown> }} clip
 */
export async function postVoiceTurn(accessToken, clip) {
  const origin = resolveStripeMobileCheckoutOrigin();
  const httpsErr = productionWebApiHttpsGuard(origin);
  if (httpsErr) {
    return { ok: false, error: httpsErr, httpStatus: 0 };
  }
  const token = String(accessToken ?? '').trim();
  if (!token) {
    return { ok: false, error: new Error('Not signed in'), httpStatus: 0 };
  }
  const uri = String(clip?.uri ?? '').trim();
  if (!uri) {
    return { ok: false, error: new Error('audio file is required'), httpStatus: 0 };
  }

  const requestId = createRequestId();
  const body = new FormData();
  body.append('audio', audioPart(uri));
  body.append('draft', JSON.stringify(mergeVoiceTurnDraft(clip?.draft)));

  let res;
  try {
    res = await fetch(`${origin}${VOICE_TURN_PATH}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Request-ID': requestId,
      },
      body,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err : new Error('Network request failed'),
      httpStatus: 0,
      requestId,
    };
  }

  let parsed = {};
  try {
    parsed = await res.json();
  } catch {
    parsed = {};
  }

  if (res.status === 200 && parsed && typeof parsed === 'object') {
    return {
      ok: true,
      data: {
        transcript: String(parsed.transcript ?? ''),
        draft: mergeVoiceTurnDraft(parsed.draft),
        ask: String(parsed.ask ?? ''),
        speak: String(parsed.speak ?? ''),
        speakAudio: parseSpeakAudio(parsed.speakAudio),
        ready: parsed.ready === true,
      },
      requestId,
    };
  }

  return {
    ok: false,
    error: new Error(mapVoiceTurnHttpError(res.status, readServerError(parsed))),
    httpStatus: res.status,
    requestId,
  };
}
