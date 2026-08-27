import { FONT_FAMILIES } from '../theme';

/**
 * Native stack titles are left-aligned on Android and centered on iOS unless this is set.
 * Use on every stack so screen names sit in the middle of the header on both platforms.
 */
export const NATIVE_STACK_HEADER_TITLE_ALIGN = 'center';

export const nativeStackHeaderTitleStyle = {
  fontFamily: FONT_FAMILIES.semibold,
};

/**
 * Shared native-stack chrome: shell background, centered title, app header type.
 *
 * @param {{ colors: { shell: string }, animation?: string }} options
 */
export function nativeStackScreenOptions({ colors, animation = 'slide_from_right' }) {
  return {
    animation,
    contentStyle: { backgroundColor: colors.shell },
    headerTitleAlign: NATIVE_STACK_HEADER_TITLE_ALIGN,
    headerTitleStyle: nativeStackHeaderTitleStyle,
  };
}
