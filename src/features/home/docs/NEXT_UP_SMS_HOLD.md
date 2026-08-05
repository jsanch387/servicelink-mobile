# Next Up — SMS hold / rollout

**Master switch:** `src/features/sms/constants/customerSmsFlags.js`

| Flag / access                       | Role                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `CUSTOMER_SMS_ENABLED`              | Kill switch — off = legacy Next Up, no Job status, no customer-text settings row |
| `CUSTOMER_SMS_EARLY_ACCESS_EMAILS`  | Temporary allowlist (your prod login) before Pro-only                            |
| `useCustomerSmsAccess().canUseSms`  | Runtime: early access **or** Pro                                                 |
| `useCustomerSmsAccess().showUpsell` | Non-Pro sees Customer notifications → upsell screen                              |

Derived compile-time aliases (follow the master flag):

| Flag                                             | File                                                    |
| ------------------------------------------------ | ------------------------------------------------------- |
| `NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS`              | `home/constants/nextUpDesignFlags.js`                   |
| `NEXT_UP_ON_MY_WAY_TRY_IT_BADGE`                 | Launch “Try it” pill on Next Up **On my way**           |
| `COMPLETE_VISIT_SHOW_CUSTOMER_NOTIFICATION_COPY` | `booking-details/constants/markCompleteFeatureFlags.js` |
| `CUSTOMER_SMS_TOASTS_ENABLED`                    | `sms/constants/customerSmsHold.js`                      |

**Canonical Next Up behavior:** [`../README.md`](../README.md).

---

## Rollback (hold mode)

```js
// src/features/sms/constants/customerSmsFlags.js
export const CUSTOMER_SMS_ENABLED = false;
```

That alone restores legacy Next Up (device Messages On my way + Navigate), hides Job status, and hides customer SMS settings / upsell.

---

## Pro-only release

1. Keep `CUSTOMER_SMS_ENABLED = true`.
2. Keep `CUSTOMER_SMS_EARLY_ACCESS_EMAILS` empty → all Pro owners get SMS UI.
3. Non-Pro keep the Customer notifications upsell (Subscribe → web).

To temporarily restrict again for QA, add emails to the allowlist (only those logins see the feature).

---

## What owners see when `canUseSms`

| Control                          | Behavior                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| **On my way**                    | Glass confirm → Send / Skip; launch **Try it** pill when `NEXT_UP_ON_MY_WAY_TRY_IT_BADGE` |
| **Navigate**                     | Always tappable; empty address → alert                                                    |
| **Slide to start**               | `job_started`                                                                             |
| **Skip** / **Done**              | `work_finished`                                                                           |
| **Mark complete**                | Complete sheet → `job_completed`                                                          |
| **Job status** (booking details) | Same lifecycle actions                                                                    |

When `canUseSms` is false (and feature enabled): legacy Next Up + Customer notifications upsell.

## What’s new modal

Active announcement: `sms-v1` in `src/features/appUpdates/constants/announcements.js` (replaces prior revenue modal).

- Shown once per device after main tabs load
- Only for owners with `canUseSms` (Pro)
- Hero: rotating sample SMS bubble (same presentation as Customer notifications upsell)
- Primary CTA → More → **Messages sent**
- Dev replay: long-press version footnote on More

## Next Up coach tips

Progressive in-card coach bubbles point at each SMS CTA (`src/features/home/constants/nextUpCoachTips.js`):

| State             | Bubble                                |
| ----------------- | ------------------------------------- |
| Upcoming          | **On my way texts them**              |
| En route          | **Slide to start texts them**         |
| Handoff           | **Done texts them**                   |
| Ready to complete | **Mark complete texts their receipt** |

- Compact bubble + bouncing pointer + soft glow on the target CTA
- Doing the CTA flashes a short “Nice” / “You got it” moment
- Once per tip (AsyncStorage `servicelink.nextUp.coachTipsSeen`); ✕ skips without the win flash
- **Try it** on On my way also once (`servicelink.nextUp.onMyWayTryItSeen`); skipped if they already used On my way from the coach tip
- SMS lifecycle only (`useLifecycleActions` / `canUseSms`)
- Dev reset: same long-press on More version footnote
