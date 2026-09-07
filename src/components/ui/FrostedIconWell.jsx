import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';

export const FROSTED_ICON_WELL_SIZE = 36;

export function frostedSurfaceColors(isDark) {
  return {
    backgroundColor: isDark ? 'rgba(255,255,255,0.26)' : 'rgba(255,255,255,0.62)',
    borderColor: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.80)',
  };
}

/**
 * Frosted square well + filled glyph. Used on Customer updates and Transactions.
 *
 * @param {{
 *   icon: string;
 *   color?: string;
 *   iconSize?: number;
 *   iconLibrary?: 'ionicons' | 'material-community';
 *   size?: number;
 * }} props
 */
export function FrostedIconWell({
  icon,
  color = '#ffffff',
  iconSize,
  iconLibrary = 'ionicons',
  size = FROSTED_ICON_WELL_SIZE,
}) {
  const { isDark } = useTheme();
  const Icon = iconLibrary === 'material-community' ? MaterialCommunityIcons : Ionicons;
  const glyphSize = iconSize ?? Math.round(size * (20 / FROSTED_ICON_WELL_SIZE));
  const radius = Math.max(8, Math.round(size * (10 / FROSTED_ICON_WELL_SIZE)));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        well: {
          alignItems: 'center',
          ...frostedSurfaceColors(isDark),
          borderRadius: radius,
          borderWidth: StyleSheet.hairlineWidth,
          height: size,
          justifyContent: 'center',
          width: size,
        },
      }),
    [isDark, radius, size],
  );

  return (
    <View style={styles.well}>
      <Icon color={color} name={icon} size={glyphSize} />
    </View>
  );
}
