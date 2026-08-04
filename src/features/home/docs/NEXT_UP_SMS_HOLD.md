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

## Personal prod → Pro-only

1. Keep `CUSTOMER_SMS_ENABLED = true`.
2. Add your prod login email to `CUSTOMER_SMS_EARLY_ACCESS_EMAILS`.
3. QA for a day.
4. Clear the allowlist → only `hasProAccess` owners get SMS UI.
5. Non-Pro keep the Customer notifications upsell (Subscribe → web).

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
