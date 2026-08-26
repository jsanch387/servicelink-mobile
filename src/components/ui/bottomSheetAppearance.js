/**
 * Frosted `appearance="glass"` sheets use `expo-blur` (`BlurView`).
 * That native module must be in the App Store / Play binary.
 *
 * Off until a native build with ExpoBlur is live in the store. Do **not**
 * OTA glass onto a binary built without ExpoBlur — those installs crash
 * with “Unimplemented Component: ExpoBlurView”.
 *
 * Opt in per call site when this flag is on. No sheets use it right now.
 */
export const BOTTOM_SHEET_GLASS_ENABLED = false;
