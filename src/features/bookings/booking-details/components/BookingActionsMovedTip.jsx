import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { SCREEN_GUTTER } from '../../../../constants/layout';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/** Same green as the header ⋯ highlight. */
export const ACTIONS_MOVED_TIP_GREEN = '#22c55e';

/**
 * Compact coach bubble over booking details, pointing at the ⋯ actions button.
 *
 * @param {{
 *   onDismiss: () => void;
 *   onPressActions: () => void;
 * }} props
 */
export function BookingActionsMovedTip({ onDismiss, onPressActions }) {
  const { colors, isDark } = useTheme();
  const accent = ACTIONS_MOVED_TIP_GREEN;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'flex-end',
          elevation: 20,
          left: SCREEN_GUTTER,
          position: 'absolute',
          right: SCREEN_GUTTER,
          top: 10,
          zIndex: 20,
        },
        caret: {
          marginBottom: -5,
          marginRight: 10,
        },
        bubble: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: isDark ? 'rgba(34, 197, 94, 0.45)' : 'rgba(22, 163, 74, 0.38)',
          borderRadius: 16,
          borderWidth: 1,
          elevation: 8,
          flexDirection: 'row',
          maxWidth: 340,
          paddingLeft: 12,
          paddingRight: 6,
          paddingVertical: 12,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.16,
          shadowRadius: 12,
          width: '100%',
        },
        actionPressable: {
          flex: 1,
          minWidth: 0,
        },
        actionRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        pressed: {
          opacity: 0.72,
        },
        iconCol: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(22, 163, 74, 0.12)',
          borderRadius: 11,
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
        labelCol: {
          flex: 1,
          gap: 3,
          justifyContent: 'center',
          minWidth: 0,
          paddingHorizontal: 12,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 18,
        },
        closeCol: {
          alignItems: 'center',
          height: 36,
          justifyContent: 'center',
          width: 36,
        },
      }),
    [colors, isDark],
  );

  return (
    <View
      accessibilityRole="summary"
      pointerEvents="box-none"
      style={styles.wrap}
      testID="booking-actions-moved-tip"
    >
      <Ionicons
        accessibilityElementsHidden
        color={accent}
        name="caret-up"
        size={16}
        style={styles.caret}
      />
      <View style={styles.bubble}>
        <Pressable
          accessibilityHint="Opens appointment actions in the top right"
          accessibilityLabel="Actions have moved. They're in the top right."
          accessibilityRole="button"
          style={styles.actionPressable}
          onPress={onPressActions}
        >
          {({ pressed }) => (
            <View style={[styles.actionRow, pressed && styles.pressed]}>
              <View style={styles.iconCol}>
                <Ionicons color={accent} name="ellipsis-horizontal" size={16} />
              </View>
              <View style={styles.labelCol}>
                <AppText numberOfLines={1} style={styles.title}>
                  Actions have moved
                </AppText>
                <AppText numberOfLines={1} style={styles.subtitle}>
                  They’re in the top right.
                </AppText>
              </View>
            </View>
          )}
        </Pressable>
        <Pressable
          accessibilityHint="Dismisses this tip"
          accessibilityLabel="Dismiss"
          accessibilityRole="button"
          hitSlop={6}
          onPress={onDismiss}
        >
          <View style={styles.closeCol}>
            <Ionicons color={colors.textMuted} name="close" size={18} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}
