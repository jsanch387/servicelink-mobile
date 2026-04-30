import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, CalendarMonthPicker, SurfaceCard } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const TIME_GRID_COLUMNS = 3;
const TIME_GRID_GAP = 10;
/** Create-appointment ScrollView horizontal padding (20 + 20). */
const CREATE_FLOW_SCROLL_PAD_X = 40;

function chunkEvery(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

/**
 * @param {{
 *   selectedDateKey: string | null;
 *   selectedTime: string | null;
 *   onSelectDateKey: (k: string) => void;
 *   onSelectTime: (t: string) => void;
 *   timeSlots: string[];
 *   scheduleLoading?: boolean;
 *   scheduleError?: string | null;
 *   acceptBookings?: boolean;
 *   isDateUnavailable?: (d: Date) => boolean;
 * }} props
 */
export function ScheduleStep({
  selectedDateKey,
  selectedTime,
  onSelectDateKey,
  onSelectTime,
  timeSlots,
  scheduleLoading = false,
  scheduleError = null,
  acceptBookings = true,
  isDateUnavailable,
}) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [timeBlockWidth, setTimeBlockWidth] = useState(0);

  const onTimeBlockLayout = useCallback((e) => {
    setTimeBlockWidth(e.nativeEvent.layout.width);
  }, []);

  const timeSlotWidth = useMemo(() => {
    const fallbackW = Math.max(
      0,
      windowWidth - CREATE_FLOW_SCROLL_PAD_X - insets.left - insets.right,
    );
    const gridW = timeBlockWidth > 0 ? timeBlockWidth : fallbackW;
    const gaps = TIME_GRID_GAP * (TIME_GRID_COLUMNS - 1);
    return (gridW - gaps) / TIME_GRID_COLUMNS;
  }, [timeBlockWidth, windowWidth, insets.left, insets.right]);

  const timeRows = useMemo(() => chunkEvery(timeSlots, TIME_GRID_COLUMNS), [timeSlots]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        calendarCard: {
          marginBottom: 16,
        },
        banner: {
          color: colors.danger,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 20,
          marginBottom: 12,
        },
        sectionLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 12,
        },
        timeRow: {
          columnGap: TIME_GRID_GAP,
          flexDirection: 'row',
          marginBottom: TIME_GRID_GAP,
        },
        timeRowLast: {
          marginBottom: 0,
        },
        timeChip: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          justifyContent: 'center',
          minHeight: 44,
          paddingVertical: 12,
        },
        timeLabel: {
          fontSize: 14,
          fontWeight: '600',
        },
        timeHint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
        },
        err: {
          color: colors.danger,
          fontSize: 14,
          marginBottom: 8,
        },
        loadingRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          marginBottom: 8,
        },
      }),
    [colors],
  );

  return (
    <View>
      {!acceptBookings ? (
        <AppText style={styles.banner}>
          This business is not accepting new bookings right now. You can still review settings in
          Availability.
        </AppText>
      ) : null}

      <SurfaceCard style={styles.calendarCard}>
        <CalendarMonthPicker
          isDateUnavailable={isDateUnavailable}
          selectedDateKey={selectedDateKey}
          onSelectDateKey={onSelectDateKey}
        />
      </SurfaceCard>

      {scheduleError ? <AppText style={styles.err}>{scheduleError}</AppText> : null}

      {selectedDateKey ? (
        <>
          <AppText style={styles.sectionLabel}>Choose time</AppText>
          {scheduleLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.accent} />
              <AppText style={styles.timeHint}>Loading open times…</AppText>
            </View>
          ) : (
            <View style={{ width: '100%' }} onLayout={onTimeBlockLayout}>
              {timeRows.length ? (
                timeRows.map((row, rowIndex) => (
                  <View
                    key={`time-row-${rowIndex}`}
                    style={[
                      styles.timeRow,
                      rowIndex === timeRows.length - 1 ? styles.timeRowLast : null,
                    ]}
                  >
                    {row.map((slot) => {
                      const selected = selectedTime === slot;
                      return (
                        <Pressable
                          key={slot}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={[
                            styles.timeChip,
                            { width: timeSlotWidth },
                            selected
                              ? {
                                  backgroundColor: '#FFFFFF',
                                  borderColor: '#FFFFFF',
                                }
                              : null,
                          ]}
                          onPress={() => onSelectTime(slot)}
                        >
                          <AppText
                            style={[
                              styles.timeLabel,
                              { color: selected ? '#000000' : colors.text },
                            ]}
                          >
                            {slot}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                ))
              ) : (
                <AppText style={styles.timeHint}>
                  No open times on this day. Try another date.
                </AppText>
              )}
            </View>
          )}
        </>
      ) : (
        <AppText style={styles.timeHint}>Select a date to see time blocks.</AppText>
      )}
    </View>
  );
}
