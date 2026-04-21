/**
 * Theme tokens — `light` and `dark` share the same keys so UI can switch without branching.
 * Add new keys to BOTH objects when extending the design system.
 */

/** @typedef {typeof darkTheme} ThemeColors */

export const darkTheme = {
  shell: '#0a0a0a',
  shellElevated: '#141414',
  surface: '#121212',
  border: '#262626',
  borderStrong: '#404040',

  text: '#fafafa',
  textSecondary: '#e5e5e5',
  textMuted: '#a3a3a3',

  /** Text links on shell (e.g. Sign up) */
  link: '#ffffff',
  /** Softer link — between bright white and gray (e.g. Forgot password) */
  linkSubtle: '#c9c9c9',

  /** Highlights / ghost buttons — neutral, not teal */
  accent: '#fafafa',
  accentMuted: '#a3a3a3',

  /** Primary CTA: white fill, black label */
  buttonPrimaryBg: '#ffffff',
  buttonPrimaryBgPressed: '#e5e5e5',
  buttonPrimaryText: '#000000',

  buttonSecondaryBg: '#262626',
  buttonSecondaryBgPressed: '#404040',
  buttonSecondaryText: '#fafafa',

  buttonGhostPressed: 'rgba(255,255,255,0.08)',

  /** Filled inputs: dark gray surface + subtle border (modern dark UI) */
  inputBg: '#1c1c1e',
  inputBorder: '#3a3a3c',
  inputText: '#fafafa',
  placeholder: '#636366',

  /** `SurfaceCard` — darker than inputs, closer to shell for a calmer list UI */
  cardSurface: '#121212',
  cardBorder: '#262626',

  /** Bottom tab: selected label + icon */
  tabBarActive: '#ffffff',

  /** Home “Next up” hero — inverted for contrast on dark shell */
  nextUpSurface: '#ffffff',
  nextUpText: '#0a0a0a',
  nextUpTextMuted: '#525252',
  /** Filled CTA on next-up card (always contrasts nextUpSurface) */
  nextUpPrimaryCtaBg: '#0a0a0a',
  nextUpPrimaryCtaText: '#ffffff',

  spinnerOnPrimary: '#000000',
  spinnerOnSecondary: '#fafafa',

  /** Form validation / auth errors */
  danger: '#f87171',
};

export const lightTheme = {
  shell: '#f5f5f5',
  shellElevated: '#e5e5e5',
  surface: '#ffffff',
  border: '#e5e5e5',
  borderStrong: '#d4d4d4',

  text: '#0a0a0a',
  textSecondary: '#404040',
  textMuted: '#737373',

  link: '#0a0a0a',
  linkSubtle: '#525252',

  accent: '#0a0a0a',
  accentMuted: '#525252',

  buttonPrimaryBg: '#0a0a0a',
  buttonPrimaryBgPressed: '#262626',
  buttonPrimaryText: '#ffffff',

  buttonSecondaryBg: '#e5e5e5',
  buttonSecondaryBgPressed: '#d4d4d4',
  buttonSecondaryText: '#0a0a0a',

  buttonGhostPressed: 'rgba(10,10,10,0.06)',

  inputBg: '#ffffff',
  inputBorder: '#6b7280',
  inputText: '#0a0a0a',
  placeholder: '#737373',

  /** `SurfaceCard` — soft gray panel vs white inputs */
  cardSurface: '#ebebeb',
  cardBorder: '#d4d4d4',

  tabBarActive: '#0a0a0a',

  nextUpSurface: '#0a0a0a',
  nextUpText: '#fafafa',
  nextUpTextMuted: '#a3a3a3',
  nextUpPrimaryCtaBg: '#fafafa',
  nextUpPrimaryCtaText: '#0a0a0a',

  spinnerOnPrimary: '#ffffff',
  spinnerOnSecondary: '#0a0a0a',

  danger: '#dc2626',
};

/** @type {{ light: ThemeColors; dark: ThemeColors }} */
export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
