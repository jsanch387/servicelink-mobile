import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { parseLocalYyyyMmDd, startOfLocalDay, toLocalYyyyMmDd } from './calendarDateKey';

const WEEK_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Mobile month grid: month navigation, weekday header, square day cells.
 * @param {{
 *   selectedDateKey: string | null;
 *   onSelectDateKey: (isoLocalYyyyMmDd: string) => void;
 *   minDate?: Date;
 *   maxDate?: Date;
 *   isDateUnavailable?: (d: Date) => boolean; optional; when true, day is disabled (e.g. no bookable slots)
 * }} props
 */
export function CalendarMonthPicker({
  selectedDateKey,
  onSelectDateKey,
  minDate: minDateProp,
  maxDate: maxDateProp,
  isDateUnavailable,
}) {
  const { colors } = useTheme();

  const today = useMemo(() => startOfLocalDay(new Date()), []);
  const minDate = useMemo(() => startOfLocalDay(minDateProp ?? today), [minDateProp, today]);
  const maxDate = useMemo(() => {
    if (maxDateProp) return startOfLocalDay(maxDateProp);
    const d = new Date(today);
    d.setFullYear(d.getFullYear() + 1);
    return startOfLocalDay(d);
  }, [maxDateProp, today]);

  const [visibleMonthStart, setVisibleMonthStart] = useState(() => {
    const s = parseLocalYyyyMmDd(selectedDateKey);
    if (s) return new Date(s.getFullYear(), s.getMonth(), 1);
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    const s = parseLocalYyyyMmDd(selectedDateKey);
    if (!s) return;
    setVisibleMonthStart(new Date(s.getFullYear(), s.getMonth(), 1));
  }, [selectedDateKey]);

  const monthLabel = useMemo(
    () =>
      visibleMonthStart.toLocaleString(undefined, {
        month: 'long',
        year: 'numeric',
      }),
    [visibleMonthStart],
  );

  const cells = useMemo(() => {
    const y = visibleMonthStart.getFullYear();
    const m = visibleMonthStart.getMonth();
    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const list = [];
    const cursor = new Date(y, m, 1);
    cursor.setDate(1 - startPad);
    for (let i = 0; i < 42; i++) {
      const cell = new Date(cursor);
      const inMonth = cell.getMonth() === m;
      list.push({ date: cell, inMonth, key: toLocalYyyyMmDd(cell) });
      cursor.setDate(cursor.getDate() + 1);
    }
    return list;
  }, [visibleMonthStart]);

  const canGoPrev = useMemo(() => {
    const first = new Date(visibleMonthStart);
    const prevLast = new Date(first);
    prevLast.setDate(0);
    return prevLast >= minDate;
  }, [visibleMonthStart, minDate]);

  const canGoNext = useMemo(() => {
    const nextStart = new Date(visibleMonthStart);
    nextStart.setMonth(nextStart.getMonth() + 1);
    const maxMonthStart = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    return nextStart <= maxMonthStart;
  }, [visibleMonthStart, maxDate]);

  const goPrevMonth = useCallback(() => {
    if (!canGoPrev) return;
    setVisibleMonthStart((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() - 1);
      return new Date(n.getFullYear(), n.getMonth(), 1);
    });
  }, [canGoPrev]);

  const goNextMonth = useCallback(() => {
    if (!canGoNext) return;
    setVisibleMonthStart((d) => {
      const n = new Date(d);
      n.setMonth(n.getMonth() + 1);
      return new Date(n.getFullYear(), n.getMonth(), 1);
    });
  }, [canGoNext]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        navRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 14,
        },
        navHit: {
          alignItems: 'center',
          borderRadius: 12,
          height: 40,
          justifyContent: 'center',
          width: 40,
        },
        monthTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
        },
        weekRow: {
          flexDirection: 'row',
          marginBottom: 8,
        },
        weekCell: {
          alignItems: 'center',
          flex: 1,
        },
        weekText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '600',
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          width: '100%',
        },
        dayCell: {
          alignItems: 'center',
          aspectRatio: 1,
          justifyContent: 'center',
          maxWidth: `${100 / 7}%`,
          width: `${100 / 7}%`,
        },
        dayInner: {
          alignItems: 'center',
          borderRadius: 10,
          height: '86%',
          justifyContent: 'center',
          maxHeight: 48,
          maxWidth: 48,
          width: '86%',
        },
        dayInnerSelected: {
          backgroundColor: '#FFFFFF',
        },
        dayNum: {
          fontSize: 15,
          fontWeight: '600',
        },
        dayNumMuted: {
          color: colors.textMuted,
          opacity: 0.45,
        },
        dayNumActive: {
          color: colors.text,
        },
        dayNumSelected: {
          color: '#000000',
        },
      }),
    [colors],
  );

  const isDisabled = useCallback(
    (d) => {
      const day = startOfLocalDay(d);
      if (day < minDate || day > maxDate) return true;
      if (typeof isDateUnavailable === 'function' && isDateUnavailable(d)) {
        return true;
      }
      return false;
    },
    [isDateUnavailable, minDate, maxDate],
  );

  return (
    <View>
      <View style={styles.navRow}>
        <Pressable
          accessibilityLabel="Previous month"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoPrev }}
          disabled={!canGoPrev}
          hitSlop={8}
          style={[styles.navHit, { opacity: canGoPrev ? 1 : 0.35 }]}
          onPress={goPrevMonth}
        >
          <Ionicons color={colors.text} name="chevron-back" size={22} />
        </Pressable>
        <AppText style={styles.monthTitle}>{monthLabel}</AppText>
        <Pressable
          accessibilityLabel="Next month"
          accessibilityRole="button"
          accessibilityState={{ disabled: !canGoNext }}
          disabled={!canGoNext}
          hitSlop={8}
          style={[styles.navHit, { opacity: canGoNext ? 1 : 0.35 }]}
          onPress={goNextMonth}
        >
          <Ionicons color={colors.text} name="chevron-forward" size={22} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEK_HEADERS.map((w) => (
          <View key={w} style={styles.weekCell}>
            <AppText style={styles.weekText}>{w}</AppText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((cell) => {
          const key = cell.key;
          const selected = selectedDateKey === key;
          const disabled = !cell.inMonth || isDisabled(cell.date);
          const muted = !cell.inMonth || disabled;
          const showAsNumberOnly = muted || !selected;

          return (
            <View key={key} style={styles.dayCell}>
              <Pressable
                accessibilityLabel={`${key}${selected ? ', selected' : ''}`}
                accessibilityRole="button"
                accessibilityState={{ disabled, selected }}
                disabled={disabled}
                style={[
                  styles.dayInner,
                  selected && !disabled ? styles.dayInnerSelected : null,
                  showAsNumberOnly && { opacity: muted ? 0.35 : 1 },
                ]}
                onPress={() => onSelectDateKey(key)}
              >
                <AppText
                  style={[
                    styles.dayNum,
                    selected && !disabled
                      ? styles.dayNumSelected
                      : muted
                        ? styles.dayNumMuted
                        : styles.dayNumActive,
                  ]}
                >
                  {cell.date.getDate()}
                </AppText>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
