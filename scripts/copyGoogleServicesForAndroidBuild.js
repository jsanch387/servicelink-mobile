/**
 * Copies google-services.json into android/app/ for Gradle (FCM).
 * Never commit that file — use EAS file env GOOGLE_SERVICES_JSON on cloud builds.
 */
const fs = require('fs');
const path = require('path');

const fromEnv = String(process.env.GOOGLE_SERVICES_JSON ?? '').trim();
const fromRoot = path.join(process.cwd(), 'google-services.json');
const target = path.join(process.cwd(), 'android/app/google-services.json');

const source =
  (fromEnv && fs.existsSync(fromEnv) && fromEnv) || (fs.existsSync(fromRoot) && fromRoot) || null;

if (!source) {
  if (process.env.EAS_BUILD === 'true') {
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
