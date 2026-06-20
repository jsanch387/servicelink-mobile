# Tap to Pay feature

In-person contactless collection on the **Complete visit** sheet via Stripe Terminal (Tap to Pay on iPhone).

**Full contract:** [`../bookings/docs/MOBILE_BOOKING_TAP_TO_PAY.md`](../bookings/docs/MOBILE_BOOKING_TAP_TO_PAY.md)

## Public exports (`index.js`)

Used by the Complete sheet and `App.js`:

- `TapToPaySheet`, `StripeTerminalAppProvider`
- `useTapToPayConnectReadiness`, `navigateToPaymentsSetup`
- `buildTapToPaySessionFees`, `isTapToPayUiEnabled`
- Connect copy constants, `TAP_TO_PAY_RECEIPT_ROW_LABEL`, `TAP_TO_PAY_USE_TERMINAL_SDK`

## Layout

```
tap-to-pay/
├── api/              POST connection-token + intent
├── components/       TapToPaySheet, TapToPayPulseVisual
├── constants/        copy, flags, layout, timings
├── hooks/            useTapToPaySheet, useTapToPayTerminalCollection, Connect readiness
├── providers/        StripeTerminalAppProvider (App.js root)
├── terminal/         connection token registry, dev mock collection
└── utils/            session fees, HTTP errors, debug logging, intent connect params
```

## Flags (`constants/tapToPayFeatureFlags.js`)

Production: server APIs + Terminal SDK on, iOS-only UI. Android collection code exists but the button is hidden until the Android app ships.

## Tests

```bash
npm test -- --testPathPattern=tap-to-pay
```
