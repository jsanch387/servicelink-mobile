import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const COLUMNS = 3;
const GAP = 10;

function chunkRows(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/**
 * @param {{
 *   timeSlots: string[];
 *   selectedTime: string | null;
 *   onSelectTime: (t: string) => void;
 *   horizontalPadding?: number;
 * }} props
 */
export function TimeSlotGrid({ timeSlots, selectedTime, onSelectTime, horizontalPadding = 40 }) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [gridWidth, setGridWidth] = useState(0);

  const onLayout = useCallback((e) => {
    setGridWidth(e.nativeEvent.layout.width);
  }, []);

  const chipWidth = useMemo(() => {
    const fallback = Math.max(0, windowWidth - horizontalPadding - insets.left - insets.right);
    const w = gridWidth > 0 ? gridWidth : fallback;
    return (w - GAP * (COLUMNS - 1)) / COLUMNS;
  }, [gridWidth, windowWidth, horizontalPadding, insets.left, insets.right]);

  const rows = useMemo(() => chunkRows(timeSlots, COLUMNS), [timeSlots]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          columnGap: GAP,
          flexDirection: 'row',
          marginBottom: GAP,
        },
        rowLast: {
          marginBottom: 0,
        },
        chip: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 44,
          paddingHorizontal: 6,
          paddingVertical: 12,
        },
        chipSelected: {
          backgroundColor: '#FFFFFF',
          borderColor: '#FFFFFF',
        },
        label: {
          fontSize: 14,
          fontWeight: '600',
        },
        empty: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
      }),
    [colors],
  );

  if (!timeSlots.length) {
    return <AppText style={styles.empty}>No open times on this day. Try another date.</AppText>;
  }

  return (
    <View style={{ width: '100%' }} onLayout={onLayout}>
      {rows.map((row, rowIndex) => (
        <View
          key={`slot-row-${rowIndex}`}
          style={[styles.row, rowIndex === rows.length - 1 ? styles.rowLast : null]}
        >
          {row.map((slot) => {
            const selected = selectedTime === slot;
            return (
              <Pressable
                key={slot}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.chip, { width: chipWidth }, selected ? styles.chipSelected : null]}
                onPress={() => onSelectTime(slot)}
              >
                <AppText style={[styles.label, { color: selected ? '#000000' : colors.text }]}>
                  {slot}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
