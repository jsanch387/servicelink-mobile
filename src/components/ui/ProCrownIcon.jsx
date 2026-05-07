import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/** Material Community Icons glyph — change here only to swap the crown asset app-wide. */
export const PRO_CROWN_ICON_NAME = 'crown-outline';

/** Section headers, pricing callouts, upgrade prompts. */
export const PRO_CROWN_COLOR_FEATURE = '#eab308';

/** Account subscription row (deeper gold on dark shell). */
export const PRO_CROWN_COLOR_ACCOUNT = '#ca8a04';

/**
 * Shared Pro crown (single source for glyph + defaults). Override `color` / `size` per screen.
 *
 * @param {{
 *   size?: number;
 *   color?: string;
 *   style?: import('react-native').StyleProp<import('react-native').ViewStyle>;
 *   accessibilityLabel?: string;
 * }} props
 */
export function ProCrownIcon({
  size = 20,
  color = PRO_CROWN_COLOR_FEATURE,
  style,
  accessibilityLabel = 'Pro',
}) {
  return (
    <MaterialCommunityIcons
      accessibilityLabel={accessibilityLabel}
      color={color}
      name={PRO_CROWN_ICON_NAME}
      size={size}
      style={style}
    />
  );
}
