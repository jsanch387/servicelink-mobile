import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function ChecklistRow({ complete, label, styles, colors }) {
  return (
    <View style={styles.row}>
      <Ionicons
        color={complete ? colors.timelineCompletedFill : colors.textMuted}
        name={complete ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
      />
      <AppText style={[styles.rowLabel, complete && styles.rowLabelComplete]}>{label}</AppText>
    </View>
  );
}

export function BookingLinkEditProfileCompletionSheet({
  visible,
  onRequestClose,
  percent = 0,
  items = [],
}) {
  const { colors } = useTheme();
  const dismiss = onRequestClose ?? (() => {});

  const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
  const completeCount = items.filter((item) => item.complete).length;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        summary: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 16,
        },
        list: {
          gap: 2,
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
          minHeight: 44,
          paddingVertical: 6,
        },
        rowLabel: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
          minWidth: 0,
        },
        rowLabelComplete: {
          color: colors.text,
        },
        footer: {
          marginTop: 20,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      fitContent
      footer={
        <View style={styles.footer}>
          <Button fullWidth title="Done" variant="secondary" onPress={dismiss} />
        </View>
      }
      title="Profile completion"
      visible={visible}
      onRequestClose={dismiss}
    >
      <AppText style={styles.summary}>
        {clampedPercent >= 100
          ? 'Your profile is complete.'
          : `${completeCount} of ${items.length} complete · ${clampedPercent}%`}
      </AppText>

      <View style={styles.list}>
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            complete={item.complete}
            colors={colors}
            label={item.label}
            styles={styles}
          />
        ))}
      </View>
    </BottomSheetModal>
  );
}
