# EAS Update (over-the-air)

Ship **JavaScript and asset changes** to users without a new App Store / Play Store submission.

Native changes (new Expo modules, `ios/` / `android/` edits, permission changes, etc.) still require a **new store build**.

---

## How it works here

| Piece                  | Value                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Service                | [EAS Update](https://docs.expo.dev/eas-update/introduction/)                       |
| Project URL            | `https://u.expo.dev/0bcb9f83-d0dc-4157-a81c-ecc3e1a069ee`                          |
| **Runtime version**    | `appVersion` policy → matches `expo.version` in `app.json` (currently **`1.0.5`**) |
| **Production channel** | `production` (store / TestFlight builds)                                           |
| **Preview channel**    | `preview` (internal builds)                                                        |

Build profiles in `eas.json` map to channels. When you publish an update, it goes to the matching channel and only installs on binaries with the same **runtime version**.

In-app behavior: `EasOverTheAirUpdateBootstrap` checks on launch and when the app returns to foreground, then reloads if a new bundle is available.

---

## One-time: enable OTA on devices (required)

**Users on the current App Store build do not have `expo-updates` yet.** OTA starts working only after you ship **one new native build** that includes this setup.

1. Commit these changes.
2. Run a production iOS build (build number will auto-increment via EAS):

   ```bash
   npx eas-cli build --platform ios --profile production
   npx eas-cli submit --platform ios --latest
   ```

3. After Apple processing, that build receives OTA updates on the **`production`** channel with runtime **`1.0.5`**.

Until that build is live, `eas update` publishes successfully but **existing store installs cannot apply them**.

---

## Day-to-day: ship JS-only changes

From repo root, on the branch you want users to get:

```bash
# Production (App Store / TestFlight on production profile)
npm run eas:update:production -- --message "Fix reviews inbox pagination"

# Internal preview builds
npm run eas:update:preview -- --message "Try new notification copy"
```

Equivalent:

```bash
npx eas-cli update --channel production --message "Describe the change"
```

Users pick up the update on next launch (or when returning to the app — we reload immediately after download).

---

## What requires a new store build vs OTA

| Change                                                | OTA (`eas update`) | New store build (`eas build`) |
| ----------------------------------------------------- | ------------------ | ----------------------------- |
| React screens, hooks, API calls                       | Yes                | No                            |
| Images / fonts in JS bundle                           | Yes                | No                            |
| Bug fixes in JS only                                  | Yes                | No                            |
| New native module (`expo install …` with native code) | No                 | Yes                           |
| `ios/` / `android/` edits                             | No                 | Yes                           |
| Push capability, entitlements, permissions            | No                 | Yes                           |
| Bump **`expo.version`** (marketing version)           | No\*               | Yes                           |

\*When you bump **`expo.version`** for a public release, publish OTA to the **new** runtime (e.g. `1.0.6`). Old `1.0.5` binaries keep receiving updates targeted at `1.0.5` only.

---

## Runtime version and App Store versioning

We use **`runtimeVersion: { policy: "appVersion" }`**. The runtime string equals **`expo.version`** (`1.0.5` today).

**Your current workflow (keep marketing version, bump build only)** is correct for TestFlight / same App Store line:

- Keep **`expo.version`** at **`1.0.5`** for JS-only fixes and OTA.
- Let **`autoIncrement`** bump **`ios.buildNumber`** / **`android.versionCode`** on each `eas build`.
- All `1.0.5` store builds share runtime **`1.0.5`** and receive the same OTA stream.

**When you ship a new public App Store version** (e.g. `1.0.6`):

1. Bump **`expo.version`** (and `package.json` version) to **`1.0.6`**.
2. Sync native runtime (EAS Build does this from config; committed native files use `Expo.plist` / `strings.xml` → `expo_runtime_version`).
3. **`eas build`** + **`eas submit`** — required for Apple review on marketing version changes.
4. Publish OTA with `--channel production`; runtime is now **`1.0.6`**.

See also [VERSIONING.md](./VERSIONING.md).

---

## Rollback

Expo dashboard → project → **Updates** → select an update group → **Republish** an earlier one, or use:

```bash
npx eas-cli update:republish --group <update-group-id>
```

---

## Verify

```bash
# List recent updates
npx eas-cli update:list --channel production

# On device: force-quit app, reopen (or background → foreground)
```

Dashboard: [expo.dev](https://expo.dev) → **servicelink-mobile** → **Updates**.
