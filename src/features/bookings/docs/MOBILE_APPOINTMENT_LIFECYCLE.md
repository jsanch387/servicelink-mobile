# Mobile appointment lifecycle — create, edit, details, complete, earnings

**Audience:** Mobile engineers (and server when aligning totals).  
**Status:** Current as of 2026-07-29 (multi-job create + edit hub + details Summary + complete/earnings heals).

This is the **product + data model reference** for owner appointments on mobile. Server HTTP contracts stay in the linked docs; this file explains how mobile stores and displays money and jobs.

---

## 1. Product model

| Concept                 | Meaning                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| **Appointment (visit)** | One calendar block: one customer, one place, one start, one status, one payment                           |
| **Job**                 | A line on that visit: catalog or custom service, price, optional tier/add-ons, duration, optional vehicle |

Rules:

- Always **one** `bookings` row per visit (even with 2–3 jobs).
- Visit duration = **sum** of job durations.
- Free-tier / cancel / pay / complete = the **appointment**, not per job.
- Vehicle lives **on each job**; visit notes live on the appointment.

---

## 2. Source of truth for pricing & add-ons

| Column                          | Role                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **`job_details`** (jsonb array) | **Source of truth** for services, per-job add-ons (`selectedAddOns`), vehicles, per-job prices (length ≥ 1, including single-job creates) |
| **`addon_details`**             | **Legacy / rollup** flattened add-ons for older readers and Complete amount-due fallbacks                                                 |
| **`service_price_cents`**       | Denormalized visit service rollup (after edit: sum of jobs; create may also set visit rollup)                                             |
| **`booking_payments`**          | `total_amount_cents`, `paid_online_amount_cents`, `session_payment_amount_cents`, `remaining_amount_cents`, session fees                  |

### Read preference (mobile)

Whenever `job_details` parses to ≥ 1 job:

1. Prefer **`job_details[].selectedAddOns`** (and per-job `servicePriceCents`).
2. If every job has **empty** add-ons but top-level **`addon_details`** has items → **heal** by using `addon_details` (legacy edits that only wrote that column).
3. If `job_details` is missing/empty → legacy flat columns only.

Shared helper for cents math: `booking-details/utils/buildJobCompletedPayload.js` → `resolveVisitServiceAndAddonCents`.

### Write preference (mobile edit)

Edit always writes **`job_details`** (length 1+) via `buildEditBookingUpdatePayload`, including `selectedAddOns` on each job, **and** flattened **`addon_details`** for rollup/legacy.

Create goes through the server (`POST /api/public/bookings` with `jobs[]`); server already persists both `job_details` and `addon_details`.

---

## 3. Create

| Topic                                 | Doc / code                                                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server contract (`jobs[]`, length 1+) | [`create-appointment/docs/OWNER_MANUAL_BOOKING_MULTI_JOB_SERVER.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_MULTI_JOB_SERVER.md)                 |
| Auth / location / legacy notes        | [`create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_SERVER.md)                                     |
| Sale / discount                       | [`create-appointment/docs/OWNER_MANUAL_BOOKING_SALE_DISCOUNT.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_SALE_DISCOUNT.md)                       |
| Schedule override                     | [`create-appointment/docs/OWNER_MANUAL_BOOKING_SCHEDULE_OVERRIDE_SERVER.md`](../create-appointment/docs/OWNER_MANUAL_BOOKING_SCHEDULE_OVERRIDE_SERVER.md) |
| Web UI replication                    | [`create-appointment/docs/WEB_MULTI_JOB_APPOINTMENT_CREATE.md`](../create-appointment/docs/WEB_MULTI_JOB_APPOINTMENT_CREATE.md)                           |
| Mobile body builder                   | `create-appointment/utils/buildOwnerBookingPayload.js`                                                                                                    |

Mobile **always** sends `jobs[]` (including length 1). Do not send top-level service/add-on fields when `jobs` is present.

---

## 4. Edit appointment

**Entry:** Booking details → Edit → visit hub (“What do you want to change?”).

### Visit hub sections

| Section                                     | Opens                                                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Jobs**                                    | Job list → job hub (Service & pricing, Vehicle)                                     |
| **Add-ons**                                 | Single catalog job → add-ons step directly; multi catalog jobs → pick job → add-ons |
| Date & time / Customer / Location / Address | Visit fields                                                                        |
| **Notes**                                   | Visit notes                                                                         |

Add-ons were moved **out of the job hub** so owners can change them with fewer taps. Pricing stays with **Service** (depends on the service).

### Persist path

- Direct Supabase `bookings.update` (`edit-appointment/api/updateBookingById.js`) — **not** the public create route.
- Payload: `edit-appointment/utils/buildEditBookingUpdatePayload.js` → writes `job_details`, `visit_job_count`, rollup `service_price_cents` / `addon_details`, visit fields.
- Then `syncBookingPaymentTotalsAfterEdit` updates `booking_payments` total/remaining from visit net.

### Key modules

| Concern            | Path                                                     |
| ------------------ | -------------------------------------------------------- |
| Controller         | `edit-appointment/hooks/useEditAppointmentController.js` |
| Visit hub sections | `edit-appointment/utils/buildEditHubSections.js`         |
| Job hub sections   | `edit-appointment/utils/buildEditJobHubSections.js`      |
| Job snapshots      | `edit-appointment/utils/mapBookingJobsForEdit.js`        |

---

## 5. Booking details UI

- **Summary** job cards for **every** booking (single + multi + legacy synthetic card).
- Schedule = date / time / duration only (service lives on Summary cards).
- Vehicles on job cards when present (no duplicate Vehicle section).
- Model: `booking-details/utils/buildBookingDetailsModel.js` (`hasJobDetails`, `formattedPrice.jobs`, add-on heal).

---

## 6. Complete visit / totals

| Topic                             | Doc / code                                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Mobile Complete + `job_completed` | [`MOBILE_BOOKING_JOB_COMPLETED.md`](./MOBILE_BOOKING_JOB_COMPLETED.md)                                             |
| Actions quick ref                 | [`MOBILE_BOOKING_ACTIONS.md`](./MOBILE_BOOKING_ACTIONS.md)                                                         |
| Server Phase 1                    | [`BOOKING_COMPLETE_PHASE1_SERVER.md`](./BOOKING_COMPLETE_PHASE1_SERVER.md)                                         |
| Amount-due / line subtotal        | Server `resolveBookingLineSubtotalCents` (must heal empty `job_details` add-ons → `addon_details`, same as mobile) |

Mobile amount helpers:

- `resolveVisitServiceAndAddonCents` — service + add-ons with legacy heal
- `computeCompleteVisitAmountDueCents` — amount due
- `buildCompleteVisitModelFromBooking` — receipt line items (same heal)

Visit net ≈ **sum(job services) + sum(job add-ons) − discount + session fees**.

---

## 7. Today’s earnings card (Home)

| Topic              | Path                                                                               |
| ------------------ | ---------------------------------------------------------------------------------- |
| Fetch today’s rows | `home/api/restOfToday.js` (`job_details`, payments incl. `remaining_amount_cents`) |
| Math               | `home/utils/todaysEarnings.js` → `computeTodaysEarnings`                           |
| UI                 | `home/components/TodaysPotentialCard.jsx`                                          |

Rules:

- One **appointment** = one earnings row (a 3-job visit is not counted 3×).
- Potential = visit total (from `job_details` sum / `subtotal_cents` / payment total, with discount/fees rules in code).
- **Completed** visits → collected = potential, **remaining $0** (even if session payment columns lag).
- Confirmed visits → prefer `remaining_amount_cents` when present; else total − (paid online + session payment).
- Multi-job: sums **all** jobs in `job_details` (does not stop at first-job `service_price_cents`).

---

## 8. Legacy heal (why it exists)

Older **single-job edits** wrote add-ons only to `addon_details` while `job_details[0].selectedAddOns` stayed `[]`. Details/Complete/earnings that preferred `job_details` looked empty or undercounted.

Mobile + server now:

1. **Edit** writes add-ons onto `job_details`.
2. **Read/complete/earnings** fall back to `addon_details` when job add-ons are empty.
3. Opening edit → Save once on an old row permanently heals `job_details`.

Going forward, create (server) + edit (mobile) should keep both columns aligned.

---

## 9. Related follow-ups

[`MULTI_JOB_MOBILE_FOLLOWUPS.md`](./MULTI_JOB_MOBILE_FOLLOWUPS.md) — older checklist; several items are done. Prefer this lifecycle doc for current behavior.

---

## 10. Quick code map

| Flow     | Entry                                                              |
| -------- | ------------------------------------------------------------------ |
| Create   | `create-appointment/` → `postOwnerManualPublicBooking`             |
| Edit     | `edit-appointment/EditAppointmentFlow.jsx`                         |
| Details  | `screens/BookingDetailsScreen.jsx` + `buildBookingDetailsModel.js` |
| Complete | `useMarkBookingCompleteFlow.js` + `buildJobCompletedPayload.js`    |
| Earnings | `useHomeDashboard.js` + `todaysEarnings.js`                        |
