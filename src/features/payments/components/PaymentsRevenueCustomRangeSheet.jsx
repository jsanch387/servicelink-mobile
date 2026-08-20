import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, CalendarMonthPicker, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { advanceRevenueDateSelection } from '../utils/advanceRevenueDateSelection';
import {
  formatRevenueCustomRangeLabel,
  isCompleteCustomRevenueRange,
} from '../utils/revenueDateWindows';

/**
 * Calendar body for a custom revenue window. Dates are local `YYYY-MM-DD`.
 * Hosted inside the Payments time-range sheet (do not mount a second modal).
 *
 * @param {{
 *   active?: boolean;
 *   initialFromYmd?: string | null;
 *   initialToYmd?: string | null;
 *   onCanViewChange?: (canView: boolean) => void;
 *   onConfirmRef?: React.MutableRefObject<(() => { fromYmd: string; toYmd: string } | null) | null>;
 * }} props
 */
export function PaymentsRevenueCustomRangeForm({
  active = true,
  initialFromYmd = null,
  initialToYmd = null,
  onCanViewChange,
  onConfirmRef,
}) {
  const { colors } = useTheme();
  const [rangeStartKey, setRangeStartKey] = useState(/** @type {string | null} */ (null));
  const [rangeEndKey, setRangeEndKey] = useState(/** @type {string | null} */ (null));

  const today = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);
  const minDate = useMemo(() => new Date(today.getFullYear() - 10, 0, 1), [today]);

  useEffect(() => {
    if (!active) return;
    setRangeStartKey(initialFromYmd ?? null);
    setRangeEndKey(initialToYmd && initialToYmd !== initialFromYmd ? initialToYmd : null);
  }, [active, initialFromYmd, initialToYmd]);

  const canView = isCompleteCustomRevenueRange(rangeStartKey, rangeEndKey);
  const selectionSummary = rangeStartKey
    ? formatRevenueCustomRangeLabel(rangeStartKey, rangeEndKey || rangeStartKey)
    : '';

  useEffect(() => {
    onCanViewChange?.(canView);
  }, [canView, onCanViewChange]);

  const handleSelectDateKey = useCallback(
    (key) => {
      const next = advanceRevenueDateSelection(rangeStartKey, rangeEndKey, key);
      setRangeStartKey(next.startKey);
      setRangeEndKey(next.endKey);
    },
    [rangeEndKey, rangeStartKey],
  );

  const handleClear = useCallback(() => {
    setRangeStartKey(null);
    setRangeEndKey(null);
  }, []);

  useEffect(() => {
    if (!onConfirmRef) return undefined;
    onConfirmRef.current = () => {
      if (!isCompleteCustomRevenueRange(rangeStartKey, rangeEndKey)) return null;
      return { fromYmd: rangeStartKey, toYmd: rangeEndKey };
    };
    return () => {
      onConfirmRef.current = null;
    };
  }, [onConfirmRef, rangeStartKey, rangeEndKey]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        hintRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          marginBottom: 12,
        },
        hintCol: {
          flex: 1,
          minWidth: 0,
        },
        hint: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        summary: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        sideCol: {
          alignItems: 'center',
          justifyContent: 'center',
        },
        sideLabel: {
          color: colors.accent,
          fontSize: 14,
          fontWeight: '600',
        },
        calendarCard: {
          marginBottom: 0,
        },
      }),
    [colors],
  );

  return (
    <>
      <View style={styles.hintRow}>
        <View style={styles.hintCol}>
          {rangeStartKey ? (
            <AppText numberOfLines={1} style={styles.summary}>
              {selectionSummary}
              {!rangeEndKey ? ' · tap end date' : ''}
            </AppText>
          ) : (
            <AppText style={styles.hint}>Tap a start date and an end date</AppText>
          )}
        </View>
        {rangeStartKey ? (
          <View style={styles.sideCol}>
            <Pressable
              accessibilityLabel="Clear dates"
              accessibilityRole="button"
              hitSlop={8}
              onPress={handleClear}
            >
              <AppText style={styles.sideLabel}>Clear</AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <SurfaceCard style={styles.calendarCard}>
        <CalendarMonthPicker
          maxDate={today}
          minDate={minDate}
          rangeEndKey={rangeEndKey}
          rangeStartKey={rangeStartKey}
          selectionMode="range"
          onSelectDateKey={handleSelectDateKey}
        />
      </SurfaceCard>
    </>
  );
}
