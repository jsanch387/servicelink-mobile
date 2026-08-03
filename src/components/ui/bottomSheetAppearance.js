/**
 * Frosted `appearance="glass"` sheets use `expo-blur` (`BlurView`), which must
 * be compiled into the App Store / Play binary.
 *
 * **Temporarily off for OTA.** The glass implementation in `BottomSheetModal`
 * is fully kept (BlurView branch, styles, motion). Store installs without
 * ExpoBlur crash with “Unimplemented Component: ExpoBlurView”, so call sites
 * pass `appearance="default"` while this is `false`.
 *
 * **Next binary release:** after shipping a native build that includes
 * `expo-blur`, flip this to `true` and OTA — glass comes back on:
 * - On my way / Done confirm
 * - Skip work notify
 * - Job status
 * - Mark as paid
 * - Link views period picker
 */
export const BOTTOM_SHEET_GLASS_ENABLED = false;
