import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Vibration,
  View,
} from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { ACTIONS_MOVED_TIP_GREEN } from './BookingActionsMovedTip';

const MOTION_ENABLED = typeof process === 'undefined' || process.env.NODE_ENV !== 'test';

/** Same well as `HeaderTextButton` so iOS 26 glass keeps the icon centered. */
const HEADER_GLASS_SIZE = 34;

/**
 * Wait after the actions modal reports dismiss before opening the next sheet.
 * Presenting in the dismiss callback itself is dropped on iOS.
 */
export const BOOKING_ACTIONS_AFTER_DISMISS_MS = 400;

/**
 * Fallback from the tap if dismiss is never reported.
 * The overlay stays up through its close animation, then the modal has to leave.
 */
export const BOOKING_ACTIONS_HANDOFF_MS = 1000;

/** @typedef {'edit' | 'schedule' | 'success' | 'danger'} ActionIconTone */

/**
 * @typedef {object} ActionConfig
 * @property {keyof typeof Ionicons.glyphMap} icon
 * @property {ActionIconTone} iconTone
 */

/** @type {Record<'edit' | 'reschedule' | 'cancel' | 'delete', ActionConfig>} */
const ACTION_CONFIG = {
  edit: { icon: 'pencil-outline', iconTone: 'edit' },
  reschedule: { icon: 'calendar-outline', iconTone: 'schedule' },
  cancel: { icon: 'close-outline', iconTone: 'danger' },
  delete: { icon: 'trash-outline', iconTone: 'danger' },
};

/**
 * @param {Array<import('react').ReactElement | null | false>} tiles
 * @returns {import('react').ReactElement[][]}
 */
function chunkActionTiles(tiles) {
  const visible = tiles.filter(Boolean);
  const rows = [];
  for (let index = 0; index < visible.length; index += 2) {
    rows.push(visible.slice(index, index + 2));
  }
  return rows;
}

function resolveIconStyle(iconTone, colors, isDark) {
  if (iconTone === 'danger') {
    return {
      iconColor: isDark ? '#fca5a5' : colors.danger,
      iconBg: isDark ? 'rgba(248, 113, 113, 0.14)' : 'rgba(220, 38, 38, 0.1)',
    };
  }
  if (iconTone === 'success') {
    return {
      iconColor: isDark ? '#86efac' : colors.textSuccess,
      iconBg: isDark ? 'rgba(74, 222, 128, 0.14)' : 'rgba(22, 163, 74, 0.1)',
    };
  }
  if (iconTone === 'edit') {
    return {
      iconColor: isDark ? '#c4b5fd' : '#7c3aed',
      iconBg: isDark ? 'rgba(167, 139, 250, 0.14)' : 'rgba(124, 58, 237, 0.1)',
    };
  }
  if (iconTone === 'schedule') {
    return {
      iconColor: isDark ? '#93c5fd' : '#2563eb',
      iconBg: isDark ? 'rgba(147, 197, 253, 0.14)' : 'rgba(37, 99, 235, 0.1)',
    };
  }
  return { iconColor: colors.textMuted, iconBg: colors.buttonGhostPressed };
}

function ActionGridTile({
  accessibilityHint,
  accessibilityLabel,
  config,
  disabled,
  label,
  loading = false,
  onPress,
}) {
  const { colors, isDark } = useTheme();
  const blocked = disabled || loading;
  const { iconColor, iconBg } = resolveIconStyle(config.iconTone, colors, isDark);
  const scale = useRef(new Animated.Value(1)).current;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cell: {
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 0,
          minWidth: 0,
        },
        pressableFill: {
          width: '100%',
        },
        face: {
          alignItems: 'center',
          alignSelf: 'stretch',
          backgroundColor: isDark ? colors.shellElevated : colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 96,
          paddingHorizontal: 8,
          paddingVertical: 16,
          rowGap: 11,
          width: '100%',
        },
        facePressed: {
          backgroundColor: isDark ? colors.buttonSecondaryBg : colors.buttonGhostPressed,
        },
        faceDisabled: {
          opacity: 0.45,
        },
        iconBadge: {
          alignItems: 'center',
          borderRadius: 13,
          height: 42,
          justifyContent: 'center',
          width: 42,
        },
        label: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.15,
          textAlign: 'center',
        },
      }),
    [colors, isDark],
  );

  const animateTo = useCallback(
    (value) => {
      Animated.spring(scale, {
        bounciness: 6,
        speed: 24,
        toValue: value,
        useNativeDriver: true,
      }).start();
    },
    [scale],
  );

  const fireActionHaptic = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
      Vibration.vibrate(6);
    });
  }, []);

  const handlePress = useCallback(() => {
    fireActionHaptic();
    onPress?.();
  }, [fireActionHaptic, onPress]);

  const handlePressIn = useCallback(() => {
    if (!blocked) {
      animateTo(0.97);
    }
  }, [animateTo, blocked]);

  const handlePressOut = useCallback(() => {
    animateTo(1);
  }, [animateTo]);

  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: blocked }}
        disabled={blocked}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.pressableFill, blocked && styles.faceDisabled]}
      >
        {({ pressed }) => (
          <Animated.View
            style={[
              styles.face,
              pressed && !blocked && styles.facePressed,
              { transform: [{ scale }] },
            ]}
          >
            <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
              {loading ? (
                <ActivityIndicator color={iconColor} size="small" />
              ) : (
                <Ionicons color={iconColor} name={config.icon} size={22} />
              )}
            </View>
            <AppText numberOfLines={1} style={styles.label}>
              {label}
            </AppText>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

function HeaderDancingDots({ color }) {
  const hops = useRef([
    new Animated.Value(MOTION_ENABLED ? 0 : 1),
    new Animated.Value(MOTION_ENABLED ? 0 : 1),
    new Animated.Value(MOTION_ENABLED ? 0 : 1),
  ]).current;

  useEffect(() => {
    if (!MOTION_ENABLED) {
      hops.forEach((hop) => hop.setValue(1));
      return undefined;
    }
    const loops = hops.map((hop, index) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(hop, {
            toValue: 1,
            duration: 720,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(hop, {
            toValue: 0,
            duration: 720,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      const start = setTimeout(() => loop.start(), index * 180);
      return () => {
        clearTimeout(start);
        loop.stop();
      };
    });
    return () => loops.forEach((stop) => stop());
  }, [hops]);

  return (
    <View style={dancingDotStyles.row}>
      {hops.map((hop, index) => (
        <Animated.View
          key={`header-dot-${index}`}
          style={[
            dancingDotStyles.dot,
            { backgroundColor: color },
            {
              opacity: hop.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] }),
              transform: [
                {
                  translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const dancingDotStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3.5,
    height: 12,
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 2.5,
    height: 5,
    width: 5,
  },
});

/**
 * Header overflow for booking actions. Row layout lives on the inner View.
 *
 * @param {{
 *   highlight?: boolean;
 *   onPress: () => void;
 * }} props
 */
export function BookingActionsHeaderButton({ highlight = false, onPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        face: {
          alignItems: 'center',
          height: HEADER_GLASS_SIZE,
          justifyContent: 'center',
          width: HEADER_GLASS_SIZE,
        },
        icon: {
          includeFontPadding: false,
          textAlign: 'center',
        },
        pressed: {
          opacity: 0.55,
        },
      }),
    [],
  );

  return (
    <Pressable
      accessibilityHint="Opens edit, reschedule, cancel, and delete"
      accessibilityLabel="More actions"
      accessibilityRole="button"
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[styles.face, pressed && styles.pressed]}>
          {highlight ? (
            <HeaderDancingDots color={ACTIONS_MOVED_TIP_GREEN} />
          ) : (
            <Ionicons
              color={colors.text}
              name="ellipsis-horizontal"
              size={22}
              style={styles.icon}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}

/**
 * Bottom sheet with the four square action tiles (plus Job status when SMS is on).
 */
export function BookingActionsSheet({
  isCancellingBooking = false,
  isDeletingBooking = false,
  isCancelDisabled = false,
  isEditDisabled = false,
  isRescheduleDisabled = false,
  isReschedulingBooking = false,
  onCancelBooking,
  onDeleteBooking,
  onEdit,
  onJobStatusPress,
  onRequestClose,
  onReschedule,
  canDeleteBookings = false,
  canWriteBookings = true,
  showCancelAction = true,
  showJobStatusAction = false,
  showRescheduleAction = true,
  visible,
}) {
  const actionsBusy = isCancellingBooking || isReschedulingBooking || isDeletingBooking;
  const gridTileCount = canWriteBookings
    ? 1 + (showRescheduleAction ? 1 : 0) + (showCancelAction ? 1 : 0) + (canDeleteBookings ? 1 : 0)
    : 0;
  const gridRowCount = Math.ceil(gridTileCount / 2);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          paddingBottom: 8,
          width: '100%',
        },
        jobStatusWrap: {
          marginBottom: 12,
        },
        rows: {
          gap: 10,
          minHeight: gridRowCount > 1 ? 202 : undefined,
          width: '100%',
        },
        spacer: {
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 0,
          minWidth: 0,
        },
        row: {
          alignItems: 'stretch',
          columnGap: 10,
          flexDirection: 'row',
          width: '100%',
        },
      }),
    [gridRowCount],
  );

  const handoffTimerRef = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const pendingActionRef = useRef(/** @type {(() => void) | null} */ (null));

  const invokePendingAction = useCallback(() => {
    if (handoffTimerRef.current) {
      clearTimeout(handoffTimerRef.current);
      handoffTimerRef.current = null;
    }
    const fn = pendingActionRef.current;
    pendingActionRef.current = null;
    if (typeof fn === 'function') fn();
  }, []);

  const schedulePendingAction = useCallback(
    (delayMs) => {
      if (!pendingActionRef.current) return;
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
      handoffTimerRef.current = setTimeout(invokePendingAction, delayMs);
    },
    [invokePendingAction],
  );

  useEffect(
    () => () => {
      if (handoffTimerRef.current) clearTimeout(handoffTimerRef.current);
    },
    [],
  );

  const runAction = useCallback(
    (fn) => {
      pendingActionRef.current = typeof fn === 'function' ? fn : null;
      onRequestClose?.();
      schedulePendingAction(BOOKING_ACTIONS_HANDOFF_MS);
    },
    [onRequestClose, schedulePendingAction],
  );

  const handleSheetDismissed = useCallback(() => {
    schedulePendingAction(BOOKING_ACTIONS_AFTER_DISMISS_MS);
  }, [schedulePendingAction]);

  return (
    <BottomSheetModal
      allowBackdropClose={!actionsBusy}
      fitContent
      showCloseButton
      showHeaderDivider
      title="Actions"
      visible={visible}
      onDismiss={handleSheetDismissed}
      onRequestClose={onRequestClose}
    >
      <View collapsable={false} style={styles.body}>
        {showJobStatusAction ? (
          <View style={styles.jobStatusWrap}>
            <Button
              accessibilityHint="Opens on my way, start job, and finish job"
              accessibilityLabel="Job status"
              disabled={actionsBusy}
              fullWidth
              iconName="pulse-outline"
              title="Job status"
              variant="secondary"
              onPress={() => runAction(onJobStatusPress)}
            />
          </View>
        ) : null}
        {canWriteBookings ? (
          <View style={styles.rows}>
            {chunkActionTiles([
              <ActionGridTile
                key="edit"
                accessibilityHint="Edit appointment details"
                accessibilityLabel="Edit booking"
                config={ACTION_CONFIG.edit}
                disabled={isEditDisabled || actionsBusy}
                label="Edit"
                onPress={() => runAction(onEdit)}
              />,
              showRescheduleAction ? (
                <ActionGridTile
                  key="reschedule"
                  accessibilityHint="Opens a screen to choose a new date and time"
                  accessibilityLabel="Reschedule booking"
                  config={ACTION_CONFIG.reschedule}
                  disabled={isRescheduleDisabled || actionsBusy}
                  label="Reschedule"
                  onPress={() => runAction(onReschedule)}
                />
              ) : null,
              showCancelAction ? (
                <ActionGridTile
                  key="cancel"
                  accessibilityLabel={isCancelDisabled ? 'Booking canceled' : 'Cancel booking'}
                  config={ACTION_CONFIG.cancel}
                  disabled={isCancelDisabled || actionsBusy}
                  label={isCancelDisabled ? 'Canceled' : 'Cancel'}
                  loading={isCancellingBooking}
                  onPress={() => runAction(onCancelBooking)}
                />
              ) : null,
              canDeleteBookings ? (
                <ActionGridTile
                  key="delete"
                  accessibilityHint="Removes this appointment from your calendar. This can't be undone."
                  accessibilityLabel="Delete booking"
                  config={ACTION_CONFIG.delete}
                  disabled={actionsBusy}
                  label="Delete"
                  loading={isDeletingBooking}
                  onPress={() => runAction(onDeleteBooking)}
                />
              ) : null,
            ]).map((row, index) => (
              <View key={`action-row-${index}`} style={styles.row} testID="booking-action-row">
                {row}
                {row.length === 1 ? <View style={styles.spacer} /> : null}
              </View>
            ))}
          </View>
        ) : canDeleteBookings ? (
          <Button
            accessibilityHint="Removes this appointment from your calendar. This can't be undone."
            accessibilityLabel="Delete booking"
            disabled={actionsBusy}
            fullWidth
            iconName="trash-outline"
            loading={isDeletingBooking}
            title="Delete booking"
            variant="danger"
            onPress={() => runAction(onDeleteBooking)}
          />
        ) : null}
      </View>
    </BottomSheetModal>
  );
}
