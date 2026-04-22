import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

const ROW_PAD_H = 16;
const ICON_COL_W = 28;
const ICON_GAP = 12;
const CHEVRON_W = 22;

/**
 * Tappable settings row: optional leading icon, label, chevron. Place inside `SettingsSection`.
 * Label is wrapped in a View so `flex` layout stays stable (Text + flex in a row is unreliable in RN).
 */
export function SettingsNavRow({ icon, label, onPress, showDividerBelow = true }) {
  const { colors } = useTheme();

  const dividerInsetLeft = icon ? ROW_PAD_H + ICON_COL_W + ICON_GAP : ROW_PAD_H;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignSelf: 'stretch',
          overflow: 'hidden',
          width: '100%',
        },
        /**
         * Row layout lives on an inner `View`. `Pressable` does not always honor
         * `flexDirection: 'row'` on the host (observed: children stack vertically).
         */
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 52,
          paddingHorizontal: ROW_PAD_H,
          paddingVertical: 13,
          width: '100%',
        },
        pressed: {
          backgroundColor: colors.buttonGhostPressed,
        },
        iconWrap: {
          alignItems: 'center',
          height: ICON_COL_W,
          justifyContent: 'center',
          marginRight: ICON_GAP,
          width: ICON_COL_W,
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        label: {
          color: colors.text,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        chevronCol: {
          alignItems: 'center',
          height: CHEVRON_W,
          justifyContent: 'center',
          marginLeft: 8,
          width: CHEVRON_W,
        },
        dividerRow: {
          flexDirection: 'row',
          paddingLeft: dividerInsetLeft,
          paddingRight: ROW_PAD_H,
        },
        hairline: {
          flex: 1,
          height: StyleSheet.hairlineWidth,
          opacity: 0.55,
        },
      }),
    [colors, dividerInsetLeft],
  );

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" onPress={onPress}>
        {({ pressed }) => (
          <View style={[styles.row, pressed && styles.pressed]}>
            {icon ? (
              <View style={styles.iconWrap}>
                <Ionicons color={colors.textMuted} name={icon} size={22} />
              </View>
            ) : null}
            <View style={styles.labelCol}>
              <AppText numberOfLines={2} style={styles.label}>
                {label}
              </AppText>
            </View>
            <View style={styles.chevronCol}>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
            </View>
          </View>
        )}
      </Pressable>
      {showDividerBelow ? (
        <View style={styles.dividerRow}>
          <View style={[styles.hairline, { backgroundColor: colors.border }]} />
        </View>
      ) : null}
    </View>
  );
}
