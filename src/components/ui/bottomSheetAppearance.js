/**
 * Frosted `appearance="glass"` sheets use `expo-blur` (`BlurView`).
 * That native module must be in the App Store / Play binary.
 *
 * Opt in per call site — do not default every `BottomSheetModal` to glass.
 * Do **not** OTA this flag onto a binary that was built without ExpoBlur —
 * those installs crash with “Unimplemented Component: ExpoBlurView”.
 *
 * Sheets that use this:
 * - Booking details ⋯ Actions
 */
export const BOTTOM_SHEET_GLASS_ENABLED = true;
