import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { BookingOnMyWayActionRow } from './BookingOnMyWayActionRow';

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
        facePressed: {
          opacity: 0.92,
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

  return (
    <View style={styles.cell}>
      <Pressable
        accessibilityHint={accessibilityHint}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: blocked }}
        disabled={blocked}
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressableFill,
          pressed && !blocked && styles.facePressed,
          blocked && styles.faceDisabled,
        ]}
      >
        <View style={styles.face}>
          {loading ? (
            <ActivityIndicator color={colors.textMuted} size="small" />
          ) : (
            <Ionicons color={iconColor} name={iconName} size={22} />
          )}
          <AppText numberOfLines={1} style={styles.label}>
            {label}
          </AppText>
        </View>
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
  showOnMyWayAction = false,
  onMyWayAlreadySent = false,
  hasCustomerSmsPhone = false,
  isOnMyWaySending = false,
  isOnMyWayDisabled = false,
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
        row: {
          alignItems: 'stretch',
          columnGap: 10,
          flexDirection: 'row',
          width: '100%',
        },
        onMyWayWrap: {
          marginBottom: 12,
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
            disabled={actionsBusy || isOnMyWayDisabled}
            hasCustomerSmsPhone={hasCustomerSmsPhone}
            loading={isOnMyWaySending}
            onPress={onOnMyWayPress}
          />
        </View>
      ) : null}
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
