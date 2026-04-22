import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

export function BookingActionsSection({
  isCancellingBooking = false,
  isCancelDisabled = false,
  isMarkingCompleted = false,
  isMarkCompletedDisabled = false,
  onCancelBooking,
  onMarkCompleted,
}) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 4,
        },
        action: {
          flex: 1,
        },
      }),
    [],
  );

  return (
    <View style={styles.row}>
      <Button
        iconName="close-circle-outline"
        disabled={isCancelDisabled || isMarkingCompleted || isCancellingBooking}
        loading={isCancellingBooking}
        onPress={onCancelBooking}
        style={styles.action}
        title={isCancelDisabled ? 'Cancelled' : 'Cancel booking'}
        variant="outline"
        outlineColor={colors.danger}
        iconColor={colors.danger}
      />
      <Button
        iconName="checkmark-circle-outline"
        disabled={
          isMarkCompletedDisabled || isMarkingCompleted || isCancellingBooking || isCancelDisabled
        }
        loading={isMarkingCompleted}
        onPress={onMarkCompleted}
        style={styles.action}
        title={isMarkCompletedDisabled ? 'Completed' : 'Mark completed'}
        variant="primary"
      />
    </View>
  );
}
