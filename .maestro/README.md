# Maestro E2E (foundation)

UI flows for ServiceLink mobile. Unit/component tests stay in Jest; Maestro covers real-device navigation.

## Prerequisites

1. Install Maestro: https://docs.maestro.dev/getting-started/installing-maestro
2. iOS Simulator or Android emulator with a **dev client** install (`npx expo run:ios` / `run:android`)
3. Metro running with E2E env (below)
4. A dedicated Supabase test user with:
   - email + password
   - existing `profiles` row
   - `onboarding_status` completed (so native lands on Home, not Mobile Setup)

## Dev-only E2E login

Auto password sign-in runs only in `__DEV__` when credentials are set. Add to **`.env.local`** (gitignored):

```bash
EXPO_PUBLIC_E2E_LOGIN=true
EXPO_PUBLIC_E2E_LOGIN_EMAIL=your-e2e-owner@example.com
EXPO_PUBLIC_E2E_LOGIN_PASSWORD=your-secret
```

Restart Metro after changing env (`EXPO_PUBLIC_*` is inlined at bundle time).

Never set these in production / App Store EAS env. Release builds have `__DEV__ === false`, so the path is inert even if env leaked.

## App IDs

| Platform | appId                             |
| -------- | --------------------------------- |
| iOS      | `com.jsanchdev.servicelinkmobile` |
| Android  | `com.myservicelink.app`           |

## Run

Maestro installs to `~/.maestro/bin`. npm scripts prepend that to `PATH` (npm uses `sh`, which does not load `.zshrc`).

```bash
# iOS (default from config.yaml)
npm run e2e:smoke

# Multi-job create appointment (2 custom jobs → confirm)
npm run e2e:multi-job

# All flows under .maestro/
npm run e2e

# Android
APP_ID=com.myservicelink.app PATH="$HOME/.maestro/bin:$PATH" maestro test .maestro/smoke-home.yaml
```

`smoke-home.yaml` clears app state, triggers E2E login on boot, and asserts `home-screen`.

`create-multi-job.yaml` stays logged in (no `clearState`), opens Create appointment, adds two **custom** jobs, picks schedule, and asserts **Appointment confirmed**. Prefer shop location when the Mobile/shop step appears (skips address). Requires open booking slots for the first available calendar day.

**iOS tip:** `hideKeyboard` often hangs on number/phone pads. The flow dismisses the keyboard by tapping the step title (e.g. `Custom job`) instead.

## Wait targets (testIDs)

| id                                                 | Screen                            |
| -------------------------------------------------- | --------------------------------- |
| `auth-boot`                                        | Auth bootstrap splash             |
| `subscription-boot`                                | Subscription gate                 |
| `login-screen`                                     | Login (if E2E login off / failed) |
| `home-screen`                                      | Home tab                          |
| `create-menu-fab` / `create-appointment`           | Home FAB → create                 |
| `create-appt-path-custom`                          | Custom job path                   |
| `create-appt-continue`                             | Wizard Continue / Confirm         |
| `create-appt-add-job`                              | Add another job                   |
| `calendar-day-first-available` / `time-slot-first` | Schedule                          |
| `create-appt-confirmed`                            | Success                           |

## Next

Add flows for edit multi-job and complete visit once create is stable.
