/**
 * Publish an EAS Update to the production channel.
 *
 * Usage:
 *   node scripts/easUpdateProduction.js --runtime 1.0.6 --platform ios --message "UI fixes"
 *   node scripts/easUpdateProduction.js --runtime 1.0.7 --platform all --message "UI fixes"
 *
 * Temporarily sets app.json runtimeVersion when --runtime differs from the repo default,
 * then restores it after publish.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(process.cwd(), 'app.json');

function readArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return fallback;
  }
  return process.argv[index + 1];
}

const targetRuntime = readArg('--runtime', null);
const platform = readArg('--platform', 'all');
const message = readArg('--message', 'Production OTA update');

const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
const savedRuntime = appJson.expo.runtimeVersion;
const publishRuntime = targetRuntime ?? savedRuntime;

if (publishRuntime !== savedRuntime) {
  appJson.expo.runtimeVersion = publishRuntime;
  fs.writeFileSync(appJsonPath, `${JSON.stringify(appJson, null, 2)}\n`);
  console.log(`Temporarily set runtimeVersion to ${publishRuntime} for OTA publish.`);
}

const command = [
  'npx eas-cli update',
  '--channel production',
  `--platform ${platform}`,
  '--environment production',
  `--message "${message.replace(/"/g, '\\"')}"`,
  '--non-interactive',
].join(' ');

try {
  execSync(command, { stdio: 'inherit', cwd: process.cwd() });
} finally {
  if (publishRuntime !== savedRuntime) {
    const restored = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    restored.expo.runtimeVersion = savedRuntime;
    fs.writeFileSync(appJsonPath, `${JSON.stringify(restored, null, 2)}\n`);
    console.log(`Restored runtimeVersion to ${savedRuntime}.`);
  }
}
