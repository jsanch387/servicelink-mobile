# App versioning (ServiceLink mobile)

## Single source of truth

| Field                 | File                                    | Example | Shown in app                |
| --------------------- | --------------------------------------- | ------- | --------------------------- |
| **Marketing version** | `app.json` → `expo.version`             | `1.0.5` | `ServiceLink v1.0.5`        |
| **iOS build**         | `app.json` → `expo.ios.buildNumber`     | `16`    | App Store / TestFlight only |
| **Android build**     | `app.json` → `expo.android.versionCode` | `16`    | Play Console only           |

Runtime reads these via **`expo-constants`** in `src/constants/appInfo.js`.

UI: **`AppVersionFootnote`** on **More** tab and **Account** screen.

`package.json` `version` is kept in sync for tooling only; the binary uses **`app.json`**.

---

## TestFlight: instant vs manual Beta App Review

Apple treats these differently:

| Change                                                                             | TestFlight                             |
| ---------------------------------------------------------------------------------- | -------------------------------------- |
| **Same marketing version**, higher **build** only (e.g. `1.0.0` build `14` → `15`) | Usually **automatic** — minutes        |
| **New marketing version** (e.g. `1.0.0` → `1.0.5`)                                 | **Beta App Review** — often 4–24 hours |

For bug-fix cycles while **`1.0.5`** is your current TestFlight / App Store line:

1. Keep **`expo.version`** at **`1.0.5`** — do not bump until a real public store release (e.g. `1.0.6`).
2. Only increase **`expo.ios.buildNumber`** each upload (must be **higher than every build already in App Store Connect**).
3. In ASC → **TestFlight**, open your latest `1.0.5` build and note its build number; set `buildNumber` to **that + 1** in `app.json` before `eas build` (e.g. after `1.0.5 (15)`, use **`16`**).

---

## What to bump when

### App Store / TestFlight upload (required every upload)

1. Open **`app.json`**
2. Increase **`expo.ios.buildNumber`** (e.g. `"2"` → `"3"`)
3. For Android store builds, increase **`expo.android.versionCode`** too

**Or** rely on EAS (see below) to auto-increment build numbers on production builds.

### User-visible release (optional)

When you want a new **marketing** version for a **public App Store** release (not routine TestFlight fixes):

1. Bump **`expo.version`** in `app.json` (e.g. `1.0.0` → `1.0.1`)
2. Bump **`version`** in `package.json` to match (optional but recommended)
3. Reset or bump build number as you prefer for the new release line

You do **not** edit `src/constants/appInfo.js` anymore — it reads from the native binary.

---

## EAS Build (`eas.json`)

| Setting                          | Value       | Meaning                                                              |
| -------------------------------- | ----------- | -------------------------------------------------------------------- |
| `cli.appVersionSource`           | `"remote"`  | Build numbers managed on EAS; sync with `eas build:version:sync`     |
| `build.production.autoIncrement` | `true`      | Each **production** `eas build` auto-bumps **build number** on EAS   |
| `build.*.channel`                | per profile | Links builds to **EAS Update** channels (`production`, `preview`, …) |

### Over-the-air updates (EAS Update)

JS-only releases use **`eas update`**, not a new App Store build. See **[eas-over-the-air-updates.md](./eas-over-the-air-updates.md)**.

Summary:

- **Runtime version** = `expo.version` (`appVersion` policy) — currently **`1.0.5`**
- **Production OTA:** `npm run eas:update:production -- --message "…"`
- **First OTA-capable binary:** one new `eas build` after enabling `expo-updates` (existing store installs cannot OTA until then)

### Production release commands

```bash
# 1. Bump marketing version in app.json if needed (expo.version)

# 2. Build for stores (autoIncrement may bump ios.buildNumber for you)
eas build --platform ios --profile production

# 3. Submit
eas submit --platform ios --profile production
```

If **`autoIncrement`** bumps the build on EAS, run **`eas build:version:sync`** (or pull the updated values) so `app.json` stays aligned — or bump `buildNumber` manually in `app.json` before each build if you prefer full control.

### Check current native versions

```bash
eas build:version:get
```

---

## Local development

- **Expo Go / dev client** may show `app.json` values or defaults; the **store binary** is authoritative after `eas build`.
- After changing `app.json`, restart Metro: `npx expo start -c`.

---

## Format

`getAppVersionLine()` → **`ServiceLink v{version}`**

Example: **`ServiceLink v1.0.5`**

`getAppBuildNumber()` is available if you need the build for support tooling later.
