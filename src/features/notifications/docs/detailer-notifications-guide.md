# Detailer notifications guide

Reference for **which events** should notify the business owner (and optionally **which channel**: push, email, SMS, in-app only). Use this when designing payloads, preferences, and server-side triggers.

**Implementation & integration (mobile + Supabase + Next.js):** see [`notifications-integration.md`](./notifications-integration.md) for architecture, table contracts, push payload rules, and server responsibilities.

**Out of scope for now:** per-link “view count” alerts (noisy, low action value). Surface **views** in analytics/dashboard instead.

---

## Bookings & calendar

| Event                                                       | Why it matters                | Suggested default           |
| ----------------------------------------------------------- | ----------------------------- | --------------------------- |
| **Appointment scheduled**                                   | New job on the books          | Push + email                |
| **Appointment canceled**                                    | Free slot, may need follow-up | Push + email                |
| **Appointment rescheduled**                                 | Time/location change          | Push + email                |
| **24h reminder** (job tomorrow)                             | Reduce no-shows               | Push (email optional)       |
| **Same-day / “in 2 hours” reminder**                        | Last-mile prep                | Push only (optional toggle) |
| **New booking request** (if you use approve-before-confirm) | Needs accept/decline          | Push + email                |
| **Booking declined** (customer or you)                      | Both sides stay aligned       | Email or in-app             |
| **No-show / client didn’t arrive** (manual mark or timer)   | Trigger follow-up workflow    | Optional push               |

---

## Customers & CRM

| Event                                                | Why it matters    | Suggested default               |
| ---------------------------------------------------- | ----------------- | ------------------------------- |
| **New customer added** (first booking or manual add) | Welcome / segment | Push or in-app (email optional) |
| **Customer updated contact** (phone/email/address)   | Avoid wrong comms | In-app or email                 |
| **Repeat customer booked** (optional)                | Upsell / VIP      | In-app only                     |

---

## Quotes

| Event                         | Why it matters                | Suggested default |
| ----------------------------- | ----------------------------- | ----------------- |
| **Quote requested / created** | Respond quickly               | Push + email      |
| **Quote sent to customer**    | Confirmation for you          | In-app            |
| **Quote accepted**            | Convert to booking or deposit | Push + email      |
| **Quote declined / expired**  | Close loop                    | In-app or email   |

---

## Payments & money

| Event                                       | Why it matters         | Suggested default     |
| ------------------------------------------- | ---------------------- | --------------------- |
| **Deposit received**                        | Job locked in          | Push + email          |
| **Full payment received**                   | Reconcile + thank-you  | Push + email          |
| **Payment failed**                          | Retry card / follow up | Push + email          |
| **Refund processed**                        | Accounting             | Email                 |
| **Payout / Stripe Connect** (if applicable) | Cash in bank           | Email (low frequency) |

---

## Account, subscription & product

| Event                                        | Why it matters       | Suggested default |
| -------------------------------------------- | -------------------- | ----------------- |
| **Subscription renewing soon** (e.g. 7 days) | Avoid surprise churn | Email             |
| **Subscription payment failed**              | Risk of losing Pro   | Push + email      |
| **Trial ending**                             | Conversion           | Email             |
| **Important product / policy update**        | Legal / safety       | Email             |

---

## Optional (enable later or per user)

| Event                               | Notes                                                       |
| ----------------------------------- | ----------------------------------------------------------- |
| **In-app message from customer**    | If you add chat or “message pro” on booking page            |
| **Weather advisory** (outdoor work) | Third-party; high noise unless very targeted                |
| **Team / staff assignment**         | If multi-user accounts exist later                          |
| **Review / feedback request**       | Usually **after** job complete; separate from “new booking” |

---

## Super simplified technical flow

```
Something happens (booking created, payment succeeded, …)
        │
        ▼
Your server decides: “Should this user get a push?”
  (checks prefs + dedupe + quiet hours if you add them)
        │
        ├──► Optional: save a row in `notifications` (in-app inbox / history)
        │
        └──► Send to Apple (APNs) / Google (FCM) using the device’s stored push token
                │
                ▼
        Phone shows banner; user taps
                │
                └──► App reads `data` payload → navigates to booking / quote / payment screen
```

**Email / SMS** use the same trigger on the server; only the “delivery” step changes (SendGrid, Twilio, etc.).

---

## Data shapes (minimal)

These are **conceptual** — names can match your DB and mobile types later.

### 1) Device registration (per user, per device)

After the app gets permission and a push token from Expo / FCM / APNs:

```json
{
  "userId": "uuid",
  "platform": "ios",
  "pushToken": "ExponentPushToken[…] or native token",
  "updatedAt": "2026-05-06T12:00:00Z"
}
```

Store one or many rows per user (phone + tablet each have a token).

### 2) User preferences (optional but recommended)

```json
{
  "userId": "uuid",
  "bookings": { "push": true, "email": true },
  "quotes": { "push": true, "email": false },
  "payments": { "push": true, "email": true },
  "marketing": { "push": false, "email": false }
}
```

Server checks this before sending.

### 3) Outbound push payload (what the phone receives)

Keep **`data`** small and structured; put human text in **`title` / `body`** (or localize on device from `type` + ids).

```json
{
  "title": "New booking",
  "body": "Jordan — Full detail tomorrow 9:00 AM",
  "data": {
    "type": "booking.scheduled",
    "bookingId": "bkg_123",
    "businessId": "biz_456"
  }
}
```

Use a small set of **`type`** strings (e.g. `booking.canceled`, `quote.created`, `payment.deposit_received`) so the app knows which screen to open.

### 4) In-app inbox row (if you show history inside the app)

```json
{
  "id": "ntf_789",
  "userId": "uuid",
  "type": "booking.scheduled",
  "title": "New booking",
  "body": "Jordan — Full detail tomorrow 9:00 AM",
  "read": false,
  "createdAt": "2026-05-06T12:00:00Z",
  "entity": { "kind": "booking", "id": "bkg_123" }
}
```

Push can **create** this row (or a server job creates it and then sends push). Same `type` + ids keep push and inbox aligned.

---

## Supabase `public.notifications` (minimal, aligned with mobile)

When a booking, quote, or payment event happens, insert one row the detailer sees in the app. **You already have the columns you need** (`type`, `reference_type`, `reference_id`, `title`, `body`, …). Tune **what you write**, not the schema.

| Column           | What to store                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `user_id`        | The detailer’s `auth.users` id (who should see it).                                                                                                                                                                                                                                                                                  |
| `type`           | Stable machine string, e.g. `booking.scheduled`, `booking.canceled`, `quote.requested`, `quote.accepted`, `payment.deposit_received`, `payment.failed`. Drives icon + **short on-device title** (minimal copy).                                                                                                                      |
| `reference_type` | One of: `booking`, `quote`, `payment` (lowercase). Used with `reference_id` for **tap → correct screen**.                                                                                                                                                                                                                            |
| `reference_id`   | UUID of that booking, quote, or payment.                                                                                                                                                                                                                                                                                             |
| `title`          | Optional; can match the short phrase for parity with email. The mobile inbox **prefers** minimal labels derived from `type` / `reference_type`, so long marketing copy here is optional.                                                                                                                                             |
| `body`           | Optional; omit or use for email/push only — **not** shown in the slim inbox list.                                                                                                                                                                                                                                                    |
| `metadata`       | JSON for structured data (amounts, Stripe ids). For a **second inbox line** (“From …”), set `customerName` / `customer_name` / `fromName`, or a full line in `inboxSubtitle` / `subtitle`. Long service names stay out of `title`; optional short `body` (≤56 chars, no URLs) can appear as a muted second line when no name is set. |

**You do not need** service names or long customer names in `title` for the inbox to feel good: keep **`type`** and **`reference_type`** accurate and **`reference_id`** set, and the detailer gets a clear line + tap-through to the right place.

---

## Implementation checklist (when you build)

- [ ] **User preferences** — Per category (bookings, quotes, payments, marketing) and per channel where legal (SMS needs opt-in).
- [ ] **Idempotency** — Same event must not spam duplicate pushes if webhook retries.
- [ ] **Deep link** — Tap notification → correct screen (booking detail, quote, payment).
- [ ] **Quiet hours** — Optional; still send email if push suppressed.
- [ ] **Copy** — Short machine `type` + correct `reference_*` for inbox + navigation; long copy for email/push in `body` / templates if needed (inbox stays minimal on mobile).

---

## Quick copy-paste list (your ideas + additions above)

**Core detailer set**

1. Appointment scheduled
2. Appointment canceled
3. Appointment rescheduled
4. Reminder — 24h before (optional: same-day / 2h)
5. New customer added
6. Quote created / requested
7. Quote accepted (or declined / expired)
8. Payment received (full)
9. Deposit received
10. Payment failed
11. New booking request (if approval flow)
12. Subscription / billing alerts (renewal, failed payment, trial ending)

**Explicitly not in v1 (per product call)**

- Link / profile view spikes (dashboard only)

Add rows to this doc as you discover new events during build.

---

## Native push (Expo) — banners on iOS/Android

**Mobile repo (done):** `expo-notifications`, permission + Expo token registration, `user_push_tokens` upsert, tap → same navigation as inbox (`reference_type` / `reference_id` in push `data`).

### 1) Supabase table + RLS

Run in SQL editor (adjust names only if you already use a different table):

```sql
create table if not exists public.user_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null,
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

alter table public.user_push_tokens enable row level security;

create policy "Users manage own push tokens"
  on public.user_push_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 2) EAS project id (required for reliable `getExpoPushTokenAsync`)

- Run `eas init` in the mobile repo (or create a project in [expo.dev](https://expo.dev)) and set **`EXPO_PUBLIC_EAS_PROJECT_ID`** in `.env.local` to that UUID. `app.config.js` injects it under `extra.eas.projectId` for Expo SDK 54+.

### 3) iOS / Android credentials

- **EAS Build** (recommended): `eas build` — EAS configures APNs (iOS) and FCM (Android) when you add credentials. Use a **development** or **preview** build on a **physical device** to test banners (simulator is limited).
- **Bare / local:** ensure push capability + correct provisioning.

### 4) Server — send the banner

When you insert `notifications` (or on the same business event), call **Expo’s Push API** with each stored `expo_push_token` for that `user_id` (respect prefs later). Minimal payload:

```json
{
  "to": "ExponentPushToken[…]",
  "title": "New appointment",
  "body": "From Jordan",
  "data": {
    "reference_type": "booking",
    "reference_id": "<uuid>"
  }
}
```

Use the same **`data`** shape as the inbox row so tap-through matches. Server needs **`EXPO_ACCESS_TOKEN`** (Expo) — keep it on the server only, never in the app.

### 5) Client env reminder

- **`EXPO_PUBLIC_*`** only for non-secret config (Supabase URL, EAS project id). Never put the Expo push **access token** in the mobile bundle.

### 6) Local full-stack test (no prod deploy)

Use **one dev Supabase project** for mobile + Next so `notifications`, `user_push_tokens`, and bookings all match.

1. **Point the app at local Next** — set in **mobile** `.env.local` (see `src/lib/webAppOrigin.js`):
   - `EXPO_PUBLIC_WEB_APP_URL=http://<your-mac-lan-ip>:3000`
   - A **physical iPhone** cannot reach `http://localhost:3000` on your Mac; use your Wi‑Fi IP (e.g. `192.168.x.x`). iOS Simulator on the same machine may use `http://localhost:3000`.

2. **Next must accept LAN connections** — e.g. `next dev -H 0.0.0.0` (or your framework’s equivalent) so the phone can hit `:3000`.

3. **Same Supabase keys** — mobile `EXPO_PUBLIC_SUPABASE_URL` / anon key and Next service role (or anon for server routes that only use RLS-safe ops) must target **that same** dev project where the token row exists.

4. **Trigger bookings only through local Next** — open the **local** booking URL in Safari on the phone (`http://<lan-ip>:3000/...`) or use whatever local admin/API creates the appointment. Scheduling on **prod** prod web will **not** call your laptop’s Next or send pushes from local code.

5. **Push path** — local Next, after inserting `notifications`, loads `user_push_tokens` and calls Expo (with `EXPO_ACCESS_TOKEN` in Next’s `.env.local`). Metro/Expo Go only serves JS; the **banner** is delivered by Apple + Expo using the token you already stored.

See also: [`delete-account-integration.md`](../../more/docs/delete-account-integration.md) (LAN / `EXPO_PUBLIC_WEB_APP_URL` notes).
