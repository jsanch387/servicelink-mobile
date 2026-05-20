# App versioning (ServiceLink mobile)

## Single source of truth

| Field                 | File                                    | Example | Shown in app                |
| --------------------- | --------------------------------------- | ------- | --------------------------- |
| **Marketing version** | `app.json` → `expo.version`             | `1.0.5` | `ServiceLink v1.0.5`        |
| **iOS build**         | `app.json` → `expo.ios.buildNumber`     | `2`     | App Store / TestFlight only |
| **Android build**     | `app.json` → `expo.android.versionCode` | `2`     | Play Console only           |

Runtime reads these via **`expo-constants`** in `src/constants/appInfo.js`.

UI: **`AppVersionFootnote`** on **More** tab and **Account** screen.

`package.json` `version` is kept in sync for tooling only; the binary uses **`app.json`**.

---

## What to bump when

### App Store / TestFlight upload (required every upload)

1. Open **`app.json`**
2. Increase **`expo.ios.buildNumber`** (e.g. `"2"` → `"3"`)
3. For Android store builds, increase **`expo.android.versionCode`** too

**Or** rely on EAS (see below) to auto-increment build numbers on production builds.

### User-visible release (optional)

When you want a new **marketing** version (what users see as “1.0.6”):

1. Bump **`expo.version`** in `app.json` (e.g. `1.0.5` → `1.0.6`)
2. Bump **`version`** in `package.json` to match (optional but recommended)
3. Reset or bump build number as you prefer for the new release line

You do **not** edit `src/constants/appInfo.js` anymore — it reads from the native binary.

---

## EAS Build (`eas.json`)

| Setting                          | Value     | Meaning                                                               |
| -------------------------------- | --------- | --------------------------------------------------------------------- |
| `cli.appVersionSource`           | `"local"` | Version + build come from **`app.json`** in this repo                 |
| `build.production.autoIncrement` | `true`    | Each **production** `eas build` can auto-bump **build number** on EAS |

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
