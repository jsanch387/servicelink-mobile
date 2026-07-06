/**
 * Copies google-services.json into android/app/ for Gradle (FCM).
 * Android-only — no-op on iOS (EAS prebuild + eas-build-post-install run for all platforms).
 * Never commit that file — use EAS file env GOOGLE_SERVICES_JSON on cloud builds.
 */
const fs = require('fs');
const path = require('path');

function resolveBuildPlatform() {
  const fromArgv = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--platform='))
    ?.split('=')[1]
    ?.trim();
  if (fromArgv) {
    return fromArgv;
  }
  const platformFlagIndex = process.argv.indexOf('--platform');
  if (platformFlagIndex >= 0) {
    const next = process.argv[platformFlagIndex + 1];
    if (next && !next.startsWith('-')) {
      return next.trim();
    }
  }
  return String(process.env.EAS_BUILD_PLATFORM ?? '').trim() || null;
}

const platform = resolveBuildPlatform();
if (platform === 'ios') {
  console.log('[copyGoogleServices] Skipping — iOS build (Android FCM file not required).');
  process.exit(0);
}

const fromEnv = String(process.env.GOOGLE_SERVICES_JSON ?? '').trim();
const fromRoot = path.join(process.cwd(), 'google-services.json');
const target = path.join(process.cwd(), 'android/app/google-services.json');
const isEasBuild = Boolean(process.env.EAS_BUILD_ID || process.env.EAS_BUILD === 'true');

const source =
  (fromEnv && fs.existsSync(fromEnv) && fromEnv) || (fs.existsSync(fromRoot) && fromRoot) || null;

if (!source) {
  if (isEasBuild && platform !== 'ios') {
    console.error(
      '[copyGoogleServices] Missing google-services.json. Set EAS file env GOOGLE_SERVICES_JSON for this profile.',
    );
    process.exit(1);
  }
  console.warn('[copyGoogleServices] No source file; skipping (ok for local dev without FCM).');
  process.exit(0);
}

fs.mkdirSync(path.dirname(target), { recursive: true });
fs.copyFileSync(source, target);
console.log('[copyGoogleServices] Copied to android/app/google-services.json');
