import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Vibration, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { BookingOnMyWayActionRow } from './BookingOnMyWayActionRow';

/** @typedef {'edit' | 'schedule' | 'success' | 'danger'} ActionIconTone */

/**
 * @typedef {object} ActionConfig
 * @property {keyof typeof Ionicons.glyphMap} icon
 * @property {ActionIconTone} iconTone
 */

/** @typedef {{ iconColor: string; iconBg: string }} ActionIconStyle */

/** @type {Record<'edit' | 'reschedule' | 'cancel' | 'complete', ActionConfig>} */
const ACTION_CONFIG = {
  edit: { icon: 'pencil-outline', iconTone: 'edit' },
  reschedule: { icon: 'calendar-outline', iconTone: 'schedule' },
  cancel: { icon: 'close-outline', iconTone: 'danger' },
  complete: { icon: 'checkmark-outline', iconTone: 'success' },
};

/** Colored icons on soft tint fills — no borders. */
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
          flexShrink: 1,
          minWidth: 0,
        },
        pressableFill: {
          flex: 1,
        },
        face: {
          alignItems: 'center',
          alignSelf: 'stretch',
          backgroundColor: isDark ? colors.shellElevated : colors.cardSurface,
          borderRadius: 14,
          justifyContent: 'center',
          minHeight: 84,
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

export function BookingActionsSection({
  isCancellingBooking = false,
  isDeletingBooking = false,
  isCancelDisabled = false,
  isEditDisabled = false,
  isMarkingCompleted = false,
  isMarkCompletedDisabled = false,
  isRescheduleDisabled = false,
  onCancelBooking,
  onEdit,
  onMarkCompleted,
  onReschedule,
  isReschedulingBooking = false,
  showOnMyWayAction = false,
  onMyWayAlreadySent = false,
  hasCustomerSmsPhone = false,
  onOnMyWayPress,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionTitle: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginBottom: 8,
        },
        onMyWayWrap: {
          marginBottom: 10,
        },
        rows: {
          gap: 10,
        },
        row: {
          alignItems: 'stretch',
          columnGap: 10,
          flexDirection: 'row',
          width: '100%',
        },
      }),
    [colors],
  );

  const actionsBusy =
    isCancellingBooking || isMarkingCompleted || isReschedulingBooking || isDeletingBooking;

  return (
    <View>
      <AppText style={styles.sectionTitle}>Actions</AppText>
      {showOnMyWayAction ? (
        <View style={styles.onMyWayWrap}>
          <BookingOnMyWayActionRow
            alreadySent={onMyWayAlreadySent}
            disabled={actionsBusy}
            hasCustomerSmsPhone={hasCustomerSmsPhone}
            onPress={onOnMyWayPress}
          />
        </View>
      ) : null}
      <View style={styles.rows}>
        <View style={styles.row}>
          <ActionGridTile
            accessibilityHint="Edit appointment details"
            accessibilityLabel="Edit booking"
            config={ACTION_CONFIG.edit}
            disabled={isEditDisabled || actionsBusy}
            label="Edit"
            onPress={onEdit}
          />
          <ActionGridTile
            accessibilityHint="Opens a sheet to choose a new date and time"
            accessibilityLabel="Reschedule booking"
            config={ACTION_CONFIG.reschedule}
            disabled={isRescheduleDisabled || actionsBusy}
            label="Reschedule"
            onPress={onReschedule}
          />
        </View>
        <View style={styles.row}>
          <ActionGridTile
            accessibilityLabel={isCancelDisabled ? 'Booking canceled' : 'Cancel booking'}
            config={ACTION_CONFIG.cancel}
            disabled={isCancelDisabled || actionsBusy}
            label={isCancelDisabled ? 'Canceled' : 'Cancel'}
            loading={isCancellingBooking}
            onPress={onCancelBooking}
          />
          <ActionGridTile
            accessibilityLabel={
              isMarkCompletedDisabled ? 'Booking completed' : 'Mark booking complete'
            }
            config={ACTION_CONFIG.complete}
            disabled={isMarkCompletedDisabled || actionsBusy || isCancelDisabled}
            label={isMarkCompletedDisabled ? 'Completed' : 'Complete'}
            loading={isMarkingCompleted}
            onPress={onMarkCompleted}
          />
        </View>
      </View>
    </View>
  );
}
