# Feature proposal: Owner voice booking — POC (round 1)

**Owner-only.** The signed-in owner talks in Create appointment. Not a customer. Not the public booking link.

**Round 1 is a listen / talk / parse loop that lands on Review.** No catalog from the database. No availability. No booking create. No 5-credit meter. Those are later rounds.

## Why this round exists

The orb, hold/tap session, and Review UI already exist. They are driven by a **timer + script** ([`appointmentVoiceDemo.js`](../voice/appointmentVoiceDemo.js)). That does not prove speech.

Round 1 answers one question: can the owner speak, can we hear them, can a cheap model fill a draft and ask what’s next, and can we open the Review we already built?

If that loop feels right, we wire live catalog, slots, credits, and owner-manual submit in later rounds.

## Success (POC done)

1. Owner taps the orb on Create appointment.
2. Hold or latch records real microphone audio.
3. A caption shows what they said.
4. The app speaks a short next question (`expo-speech` is enough).
5. The draft grows (name, phone, service, price, add-ons, vehicle, address, date, time).
6. When required fields are present, **Review** opens with those values (edit still works).
7. Submit may close the sheet only. It must **not** create a booking in this round.

## Already in the app (do not rebuild)

| Piece | Where |
| ----- | ----- |
| Orb + session + hold/latch | [`voice/AppointmentVoiceHost.jsx`](../voice/AppointmentVoiceHost.jsx), [`voice/AppointmentVoiceSession.jsx`](../voice/AppointmentVoiceSession.jsx) |
| Review cards + Edit/Done | [`voice/AppointmentVoiceReview.jsx`](../voice/AppointmentVoiceReview.jsx) + `ReviewStep` |
| Draft shape | `emptyVoiceReviewDraft()` in [`voice/appointmentVoiceDemo.js`](../voice/appointmentVoiceDemo.js) |

Replace the scripted `turnIndex` driver. Keep the shell.

## Mobile work (this repo)

Do these while the server stub is built. Mobile can compile against the contract with a local Next origin (`EXPO_PUBLIC_WEB_APP_URL`).

### 1. Mic + talk packages

- Add `expo-audio` (record) and `expo-speech` (read `speak` back).
- iOS: `NSMicrophoneUsageDescription` in `app.json` / `app.config.js`.
- Android: `RECORD_AUDIO`.
- Rebuild the native client after permission strings change.

### 2. Record on the gestures we already have

In [`AppointmentVoiceSession.jsx`](../voice/AppointmentVoiceSession.jsx):

- **Hold** → record while pressed → on release, send the clip.
- **Tap / latch** → keep recording until tap-to-stop or ~2s silence, then send.
- Remove `VOICE_LISTEN_MS` advancing `turnIndex`. That timer is the fake listener.

### 3. Thin HTTP client

New: `voice/api/postVoiceTurn.js`

- Same origin + Bearer JWT as [`postOwnerManualPublicBooking.js`](../api/postOwnerManualPublicBooking.js).
- `POST /api/voice/turn` multipart: `audio` + `draft` (JSON string).
- Apply `{ transcript, draft, ask, speak, ready }` into session state.
- Show `transcript` as a caption. Show `ask` where we show `turn.ai` today.
- If `ready === true`, `setMode('review')` (same as today’s scripted ready).

No `GET /api/voice/allowance`. No `source: "voice"` on create.

### 4. Keep Review, skip create

Leave Submit as close-only (or a no-op). Do **not** hook `useCreateAppointmentController` / `postOwnerManualPublicBooking` in this round.

## Server work (minimal, no DB)

Enough for the phone to be real. Frozen catalog in the prompt is fine (same idea as `VOICE_DEMO_ADDON_CATALOG`: Full detail, Sedan $89, Ceramic coat $149).

| Endpoint | POC behavior |
| -------- | ------------ |
| `POST /api/voice/turn` | Owner JWT. Deepgram (or any STT) on the clip. Cheap LLM + frozen catalog → updated `draft`, one `ask` / `speak`, `ready`. **Do not** query `business_services` / add-ons / availability. |
| Create booking | Unchanged. Voice does not call it. |
| Allowance / credits | Skip. |

Suggested response (POC):

```json
{
  "transcript": "Full detail for Jose",
  "draft": {
    "customer": "Jose",
    "phone": "",
    "service": "Full detail",
    "pricing": "",
    "addons": [],
    "vehicleYear": "",
    "vehicleMake": "",
    "vehicleModel": "",
    "address": "",
    "date": "",
    "time": ""
  },
  "missing": ["phone"],
  "ask": "What’s the phone number?",
  "speak": "What’s the phone number?",
  "ready": false
}
```

`ready: true` when the POC required set is filled: customer, phone (10 digits), service, pricing, address, date, time, vehicle year/make/model. Add-ons optional.

Ask **one** missing field at a time so the owner is not dumping a whole booking into one utterance.

## Out of this POC

- Live catalog / prices from Supabase
- Slot checks
- MapTiler address resolve
- Credits (5 beta), lock orb, feedback sheet
- Creating the appointment
- Business advisor
- Realtime / barge-in / cloud TTS
- Public booking-link voice

## Order on mobile

1. Permissions + `expo-audio` / `expo-speech`.
2. Record clip on hold/latch; log file length locally.
3. `postVoiceTurn` + caption + `ask` + `expo-speech`.
4. Apply `draft`; open Review on `ready`.
5. Stop. Demo the loop. Do not start credits or submit.

## Later rounds (not this doc)

Wire live catalog and slots, increment credits on owner-manual create, lock the orb at 0, then Submit through the existing owner booking path. See the v1 plan for that sequence.
