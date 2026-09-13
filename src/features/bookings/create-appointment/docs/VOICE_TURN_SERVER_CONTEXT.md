# Voice turn — working server context (scratch)

Not a final contract. Copy this into the web/Next.js repo if you want. Delete sections as they ship. A real contract doc comes later.

**Owner-only.** Same auth as owner-manual booking. Not the public booking link. Do not create a booking from this route.

---

## Mobile today (already done)

- Orb records a real `.m4a` on hold/release or tap-to-latch.
- Screen shows `Recorded Xs`. Clip is **not uploaded yet**.
- Draft shape lives on the phone as:

```json
{
  "customer": "",
  "phone": "",
  "service": "",
  "pricing": "",
  "addons": [],
  "vehicleYear": "",
  "vehicleMake": "",
  "vehicleModel": "",
  "address": "",
  "date": "",
  "time": ""
}
```

`addons` later: `[{ "id": "ceramic-coat", "name": "Ceramic coat", "priceLabel": "$149" }]`.

Phone origin: `EXPO_PUBLIC_WEB_APP_URL` (dev often `http://localhost:3000`). Bearer = Supabase `session.access_token`.

---

## Build this first (echo only)

`POST /api/voice/turn`

**In**

- Header: `Authorization: Bearer <owner JWT>`
- `multipart/form-data`
  - `audio` — file (`.m4a` / wav)
  - `draft` — JSON string (the object above; may be all empty)

**Do**

1. Reject if not a signed-in owner (`401` / `403`).
2. Read `audio` + `draft`. If `draft` is missing/invalid, use an empty draft.
3. You do **not** need to transcribe or call an LLM yet.
4. You do **not** need to persist the file.
5. Return JSON (echo).

**Out (echo stub)**

```json
{
  "transcript": "(server got the clip)",
  "draft": {},
  "missing": ["phone"],
  "ask": "Got the audio. AI comes next.",
  "speak": "Got the audio. AI comes next.",
  "speakAudio": {
    "base64": "<mp3 bytes>",
    "mimeType": "audio/mpeg"
  },
  "ready": false
}
```

`speakAudio` is optional. When `base64` + `mimeType: "audio/mpeg"` are present, the phone plays that MP3 and does **not** run device TTS. If `speakAudio` is `null` or missing, it falls back to `expo-speech` on `speak`. No extra URL. No Deepgram key on the phone.

Put the parsed `draft` back on `draft` (unchanged). Always return the **full** draft object, not a patch.

**Done when:** hitting the route with a token + dummy file returns 200 and that JSON. Mobile POSTs the real clip from [`postVoiceTurn.js`](../voice/api/postVoiceTurn.js), shows `ask` / `transcript`, and plays `speakAudio` (or `speak`).

---

## After the echo works (do not start these yet)

| Next | Server does |
| ---- | ----------- |
| STT | Transcribe `audio` (Deepgram or similar) → real `transcript` |
| Parse | Cheap LLM + **frozen** catalog in the prompt (no DB). Merge into `draft`. One `ask` / `speak`. `ready` when required fields are filled. |
| Later | Live catalog, slots, credits, owner-manual create. Not this file. |

Frozen catalog for the parse step: Full detail, Sedan · $89, Ceramic coat · $149.

Required before `ready: true`: customer, 10-digit phone, service, pricing, address, date, time, vehicleYear, vehicleMake, vehicleModel. Add-ons optional. Ask **one** missing field at a time.

Keys stay on the server: `DEEPGRAM_API_KEY`, OpenAI/Gemini. Never in Expo.

---

## Do not build on this route

- Public / guest voice
- Supabase catalog or availability queries
- MapTiler
- Credit meter
- `POST` that creates a booking

---

## Suggested web files (names only)

- `app/api/voice/turn/route.ts`
- Reuse whatever you already use to resolve owner + `businessId` from the Bearer JWT

Mobile follow-up (other repo): `voice/api/postVoiceTurn.js` then session applies `{ transcript, draft, ask, speak, speakAudio, ready }`.
