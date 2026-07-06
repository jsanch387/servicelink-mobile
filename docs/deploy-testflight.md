# Deploy to TestFlight (simple checklist)

Ship code changes to **internal TestFlight** testers. You do **not** need a finished App Store listing (screenshots, full description) for internal testing.

---

## One-time setup (skip if already done)

1. **Apple Developer Program** — paid membership active.
2. **App Store Connect** — app exists with bundle id **`com.jsanchdev.servicelinkmobile`** (must match `app.json` → `expo.ios.bundleIdentifier`).
3. **Expo** — logged in: `npx eas-cli whoami` (if not: `npx eas-cli login`).
4. **EAS project** — `app.json` already has `extra.eas.projectId`.
5. **Secrets / env** — production variables set on [expo.dev](https://expo.dev) for the **production** environment (same ones you use for prod API URLs, Supabase keys, etc.).

---

## Every new TestFlight build

Do this from the **repo root** (`servicelink-mobile`).

### 1. Save your work

```bash
git status
git add -A
git commit -m "Describe your change"
```

EAS builds **what is committed** if you use the default git behavior, or your local tree depending on settings—best practice is **commit** so the build matches what you think you shipped.

### 2. Cloud build (iOS, production profile)

```bash
npx eas-cli build --platform ios --profile production
```

- Wait until the build is **Finished** (link in terminal or on expo.dev → Builds).
- If the CLI asks about **credentials** or **provisioning profile** updates after bundle-id or capability changes, accept so signing stays valid.

### 3. Upload to Apple (App Store Connect)

```bash
npx eas-cli submit --platform ios --latest
```

Sign in with the **Apple ID** that has access to your team.  
**Alternative:** expo.dev → your project → **Builds** → open the iOS build → **Submit to App Store**.

### 4. TestFlight in the browser

1. Open [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → your app → **TestFlight**.
2. Wait for the build to leave **Processing** (often ~10–30+ minutes).
3. **Export / encryption compliance** — if you see **Missing Compliance** on the build, open the build and complete the questionnaire (typical HTTPS-only app: **none of the proprietary / custom algorithms**; save).  
   _Tip:_ adding `ITSAppUsesNonExemptEncryption` = `false` in `Info.plist` (when accurate) reduces repeat prompts—see Apple’s docs if unsure.
4. **Internal testing** — sidebar **Internal Testing** → your group (e.g. **Team (Expo)**):
   - Ensure the **new build** is enabled for that group.
   - Testers must be **App Store Connect users** on your team (same email as their **Media & Purchases** Apple ID on the phone).

### 5. On the iPhone

1. Install **TestFlight** from the App Store (if needed).
2. Open the **email invite** from Apple → **View in TestFlight** / **Start Testing** (do not rely on “Redeem” for internal invites).
3. Install the new build; open the app and test.

---

## Quick reference (copy-paste)

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --latest
```

Then: App Store Connect → **TestFlight** → wait **Processing** → **compliance** if asked → **internal group** has build on → **email link** on device.

---

## Names you might see (not bugs)

| Where                                    | What it is                                                                                                                                    |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home screen under the icon**           | **`CFBundleDisplayName`** — set in `app.json` / `ios/.../Info.plist` (e.g. **ServiceLink**).                                                  |
| **TestFlight / App Store Connect title** | **App name in App Store Connect** — can be longer (e.g. “ServiceLink for Business”) for uniqueness; it does not have to match the icon label. |

---

## If something fails

| Symptom                              | What to try                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Submit** errors (icons, bundle id) | Fix `app.json` + native `ios/` project, then **new** `eas build` (you cannot patch an uploaded `.ipa`).                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Signing** errors                   | Run build again; say **yes** to credential / profile refresh, or `npx eas-cli credentials` and follow prompts.                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Tap to Pay entitlement / profile** | App entitlements are correct; the **App Store provisioning profile** must be regenerated after Apple grants Tap to Pay. In [Apple Developer](https://developer.apple.com/account/resources/identifiers) → Identifiers → `com.jsanchdev.servicelinkmobile`, confirm **Tap to Pay on iPhone** is on and provisioning support includes **Distribution**. Then `npx eas-cli credentials:configure-build -p ios -e production` → regenerate provisioning profile, and rebuild **without** `EXPO_NO_CAPABILITY_SYNC=1`. |
| **No TestFlight invite**             | Attach **internal group** to the build; complete **compliance**; same **Apple ID** on phone as internal tester; check **spam** for Apple mail.                                                                                                                                                                                                                                                                                                                                                                    |

---

## App Store (public release) — not covered here

Internal TestFlight is enough to test. **Public** release needs **Distribution** tab metadata (screenshots, description, privacy, review). See [app-launch-todos.md](./app-launch-todos.md).
