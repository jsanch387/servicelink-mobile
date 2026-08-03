# More feature

Account settings, notification settings, legal, subscription entry points, delete account, and related tools.

## Notification settings

`NotificationSettingsScreen` (More → Notifications):

- **What you'll get** — Bookings and Quotes only for now (info, no toggles). Payments / product later.
- **To your customers → Messages sent** — opens `SentTextsScreen` (`ROUTES.SENT_TEXTS`) timeline from `sms_messages`.
- **This device** — OS push permission On/Off/Not set + Allow / Open system settings.

Messages sent live under `src/features/sms/` (fetch, hook, presentation, screen). See [`../bookings/docs/MOBILE_SMS_AND_BOOKING_ACTIONS.md`](../bookings/docs/MOBILE_SMS_AND_BOOKING_ACTIONS.md) §2.

## Documentation

| Doc                                                                          | Purpose                                                                                       |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [`docs/delete-account-integration.md`](./docs/delete-account-integration.md) | `DELETE /api/account` contract, LAN / `EXPO_PUBLIC_WEB_APP_URL`, production guardrails, tests |
