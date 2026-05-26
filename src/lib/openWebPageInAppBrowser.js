import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';

/**
 * Opens a web URL in an in-app browser sheet (SFSafariViewController on iOS).
 * Prefer this over `Linking.openURL` for auth and account pages (App Store Guideline 4).
 *
 * @param {string} url
 */
export async function openWebPageInAppBrowser(url) {
  const target = String(url ?? '').trim();
  if (!target) {
    return;
  }
  await openBrowserAsync(target, {
    presentationStyle: WebBrowserPresentationStyle.PAGE_SHEET,
  });
}
