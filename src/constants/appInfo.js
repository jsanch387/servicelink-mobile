/** Display version for in-app footer (independent of package.json during rapid iteration). */
export const APP_DISPLAY_NAME = 'ServiceLink';
export const APP_VERSION = '1.0.4';

/** e.g. "ServiceLink V1.0.4" */
export function getAppVersionLine() {
  return `${APP_DISPLAY_NAME} V${APP_VERSION}`;
}
