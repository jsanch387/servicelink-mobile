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
 * }} props
 */
export function FrostedIconWell({
  icon,
  color = '#ffffff',
  iconSize = 20,
  iconLibrary = 'ionicons',
}) {
  const { isDark } = useTheme();
  const Icon = iconLibrary === 'material-community' ? MaterialCommunityIcons : Ionicons;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        well: {
          alignItems: 'center',
          ...frostedSurfaceColors(isDark),
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          height: FROSTED_ICON_WELL_SIZE,
          justifyContent: 'center',
          width: FROSTED_ICON_WELL_SIZE,
        },
      }),
    [isDark],
  );

  return (
    <View style={styles.well}>
      <Icon color={color} name={icon} size={iconSize} />
    </View>
  );
}
