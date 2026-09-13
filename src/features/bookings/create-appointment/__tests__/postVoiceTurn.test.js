jest.mock('../../../../lib/webAppOrigin', () => ({
  getWebAppOrigin: jest.fn(),
}));

import { getWebAppOrigin } from '../../../../lib/webAppOrigin';
import { emptyVoiceReviewDraft } from '../voice/appointmentVoiceDemo';
import { mergeVoiceTurnDraft, postVoiceTurn } from '../voice/api/postVoiceTurn';

describe('postVoiceTurn', () => {
  const originalDev = global.__DEV__;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    global.__DEV__ = true;
    global.fetch = jest.fn();
    getWebAppOrigin.mockReturnValue('http://localhost:3000');
  });

  afterAll(() => {
    global.__DEV__ = originalDev;
    global.fetch = originalFetch;
  });

  it('POSTs multipart audio + draft with a Bearer token', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        transcript: '(server got the clip)',
        draft: emptyVoiceReviewDraft(),
        missing: ['phone'],
        ask: 'Got the audio. AI comes next.',
        speak: 'Got the audio. AI comes next.',
        speakAudio: { base64: ' ZmFrZQ== ', mimeType: 'audio/mpeg' },
        ready: false,
      }),
    });

    const result = await postVoiceTurn('owner-token', {
      uri: 'file:///tmp/voice-clip.m4a',
      draft: emptyVoiceReviewDraft(),
    });

    expect(result.ok).toBe(true);
    expect(result.data.ask).toBe('Got the audio. AI comes next.');
    expect(result.data.speakAudio).toEqual({
      base64: 'ZmFrZQ==',
      mimeType: 'audio/mpeg',
    });
    expect(result.data.ready).toBe(false);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/voice/turn');
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toBe('Bearer owner-token');
    expect(options.headers['Content-Type']).toBeUndefined();
    expect(options.body).toBeInstanceOf(FormData);
  });

  it('drops missing speakAudio', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        transcript: '',
        draft: emptyVoiceReviewDraft(),
        ask: 'What’s the phone number?',
        speak: 'What’s the phone number?',
        ready: false,
      }),
    });

    const missing = await postVoiceTurn('owner-token', {
      uri: 'file:///tmp/voice-clip.m4a',
    });
    expect(missing.data.speakAudio).toBeNull();
  });

  it('maps 401 to a sign-in error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: 'Unauthorized' }),
    });

    const result = await postVoiceTurn('stale', { uri: 'file:///tmp/voice-clip.m4a' });
    expect(result.ok).toBe(false);
    expect(result.httpStatus).toBe(401);
    expect(result.error.message).toBe('Sign in again to use voice booking.');
  });

  it('fills missing draft keys', () => {
    expect(mergeVoiceTurnDraft({ customer: 'Jose' })).toMatchObject({
      customer: 'Jose',
      phone: '',
      addons: [],
    });
  });
});
