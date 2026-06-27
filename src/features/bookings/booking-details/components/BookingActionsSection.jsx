import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, Vibration, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const RESCHEDULE_ICON = '#94a3b8';
const COMPLETE_ICON = '#22c55e';

function ActionSurfaceTile({
  accessibilityHint,
  accessibilityLabel,
  disabled,
  iconColor,
  iconName,
  label,
  loading = false,
  onPress,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        /** Wrapper earns equal column width; Pressable fills it (`flex` on Pressable alone is flaky). */
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
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 82,
          paddingHorizontal: 4,
          paddingVertical: 14,
          rowGap: 8,
          width: '100%',
        },
        faceDisabled: {
          opacity: 0.48,
        },
        label: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const blocked = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

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
      animateTo(0.96);
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
        <Animated.View style={[styles.face, { transform: [{ scale }] }]}>
          {loading ? (
            <ActivityIndicator color={colors.textMuted} size="small" />
          ) : (
            <Ionicons color={iconColor} name={iconName} size={22} />
          )}
          <AppText numberOfLines={1} style={styles.label}>
            {label}
          </AppText>
        </Animated.View>
      </Pressable>
    </View>
  );
}

export function BookingActionsSection({
  isCancellingBooking = false,
  isDeletingBooking = false,
  isCancelDisabled = false,
  isMarkingCompleted = false,
  isMarkCompletedDisabled = false,
  isRescheduleDisabled = false,
  onCancelBooking,
  onMarkCompleted,
  onReschedule,
  isReschedulingBooking = false,
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
      <View style={styles.row}>
        <ActionSurfaceTile
          accessibilityHint="Opens a sheet to choose a new date and time"
          accessibilityLabel="Reschedule booking"
          disabled={isRescheduleDisabled || actionsBusy}
          iconColor={RESCHEDULE_ICON}
          iconName="sync-outline"
          label="Reschedule"
          onPress={onReschedule}
        />
        <ActionSurfaceTile
          accessibilityLabel={isCancelDisabled ? 'Booking canceled' : 'Cancel booking'}
          disabled={isCancelDisabled || actionsBusy}
          iconColor={colors.danger}
          iconName="close-circle-outline"
          label={isCancelDisabled ? 'Canceled' : 'Cancel'}
          loading={isCancellingBooking}
          onPress={onCancelBooking}
        />
        <ActionSurfaceTile
          accessibilityLabel={
            isMarkCompletedDisabled ? 'Booking completed' : 'Mark booking complete'
          }
          disabled={isMarkCompletedDisabled || actionsBusy || isCancelDisabled}
          iconColor={COMPLETE_ICON}
          iconName="checkmark-circle-outline"
          label={isMarkCompletedDisabled ? 'Completed' : 'Complete'}
          loading={isMarkingCompleted}
          onPress={onMarkCompleted}
        />
      </View>
    </View>
  );
}
