import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  AppText,
  useWheelPickerSheet,
  WHEEL_ITEM_HEIGHT,
  WheelColumn,
  WheelPickerSheetShell,
} from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  CADENCE_UNITS,
  cadenceCountOptions,
  cadenceKeyFromParts,
  clampCadenceCount,
  formatCadenceCountLabel,
  formatCustomCadenceLabel,
  normalizeCadenceInterval,
} from '../constants/planCadence';

/** Counts still free for a unit — cadences another schedule already sells are left out. */
function availableCounts(interval, takenKeys) {
  const counts = cadenceCountOptions(interval).filter(
    (count) => !takenKeys.has(cadenceKeyFromParts(count, interval)),
  );
  return counts.length > 0 ? counts : cadenceCountOptions(interval);
}

function CadencePickerSheet({
  initialCount,
  initialInterval,
  takenKeys,
  onConfirm,
  onRequestClose,
  sheetStyle,
  backdropStyle,
}) {
  const { colors } = useTheme();
  const [interval, setIntervalUnit] = useState(normalizeCadenceInterval(initialInterval));
  const [count, setCount] = useState(clampCadenceCount(initialCount, initialInterval));
  const wheelRef = useRef(null);

  const counts = useMemo(() => availableCounts(interval, takenKeys), [interval, takenKeys]);
  const labels = useMemo(
    () => counts.map((option) => formatCadenceCountLabel(option, interval)),
    [counts, interval],
  );
  const selectedLabel = formatCadenceCountLabel(count, interval);

  // Open already parked on the current cadence; later unit switches are the column's own job.
  useEffect(() => {
    const startInterval = normalizeCadenceInterval(initialInterval);
    const index = Math.max(
      0,
      availableCounts(startInterval, takenKeys).indexOf(
        clampCadenceCount(initialCount, startInterval),
      ),
    );
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        wheelRef.current?.scrollTo({ animated: false, y: index * WHEEL_ITEM_HEIGHT });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [initialCount, initialInterval, takenKeys]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        unitRow: {
          flexDirection: 'row',
          gap: 8,
        },
        unitChip: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flex: 1,
          height: 44,
          justifyContent: 'center',
        },
        unitChipOn: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        unitLabel: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 14,
          fontWeight: '600',
        },
        unitLabelOn: {
          color: colors.shell,
        },
        wheelRow: {
          alignItems: 'center',
          marginTop: 6,
        },
        wheel: {
          width: 160,
        },
      }),
    [colors],
  );

  const selectUnit = (nextInterval) => {
    if (nextInterval === interval) return;
    void Haptics.selectionAsync().catch(() => {});
    const nextCounts = availableCounts(nextInterval, takenKeys);
    const clamped = clampCadenceCount(count, nextInterval);
    setIntervalUnit(nextInterval);
    setCount(nextCounts.includes(clamped) ? clamped : nextCounts[0]);
  };

  return (
    <WheelPickerSheetShell
      backdropStyle={backdropStyle}
      confirmTitle="Set schedule"
      sheetStyle={sheetStyle}
      title="How often"
      onConfirm={() => onConfirm({ count, interval })}
      onRequestClose={onRequestClose}
    >
      <View style={styles.body}>
        <View style={styles.unitRow}>
          {CADENCE_UNITS.map((unit) => {
            const isActive = unit.key === interval;
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                activeOpacity={0.85}
                key={unit.key}
                style={[styles.unitChip, isActive && styles.unitChipOn]}
                onPress={() => selectUnit(unit.key)}
              >
                <AppText style={[styles.unitLabel, isActive && styles.unitLabelOn]}>
                  {unit.label}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.wheelRow}>
          <WheelColumn
            listRef={wheelRef}
            selected={selectedLabel}
            values={labels}
            wheelStyle={styles.wheel}
            onSelectedChange={(label) => {
              const index = labels.indexOf(label);
              if (index >= 0) setCount(counts[index]);
            }}
          />
        </View>
      </View>
    </WheelPickerSheetShell>
  );
}

/**
 * Trigger that opens a cadence wheel. Cadences another schedule already sells are left out.
 *
 * @param {object} props
 * @param {number} props.count
 * @param {'week' | 'month'} props.interval
 * @param {Set<string>} props.takenKeys
 * @param {(next: { count: number; interval: 'week' | 'month' }) => void} props.onChange
 * @param {string} [props.label] — omit or pass empty string to hide
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style]
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.triggerStyle]
 */
export function CustomCadenceField({
  count,
  interval,
  takenKeys,
  onChange,
  label = 'Charge every',
  style,
  triggerStyle,
}) {
  const { colors } = useTheme();
  const currentRef = useRef({ count, interval, takenKeys });
  currentRef.current = { count, interval, takenKeys };

  const { host, present } = useWheelPickerSheet(({ backdropStyle, close, sheetStyle }) => (
    <CadencePickerSheet
      backdropStyle={backdropStyle}
      initialCount={currentRef.current.count}
      initialInterval={currentRef.current.interval}
      sheetStyle={sheetStyle}
      takenKeys={currentRef.current.takenKeys}
      onConfirm={(next) => {
        onChange(next);
        close();
      }}
      onRequestClose={close}
    />
  ));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          fontWeight: '500',
          marginBottom: 8,
        },
        trigger: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.inputBorder,
          borderRadius: 16,
          borderWidth: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 46,
          paddingHorizontal: 14,
        },
        triggerText: {
          color: colors.text,
          flexShrink: 1,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
        },
      }),
    [colors],
  );

  return (
    <View style={style}>
      {label ? <AppText style={styles.label}>{label}</AppText> : null}
      <TouchableOpacity
        accessibilityLabel="Choose how often this schedule charges"
        accessibilityRole="button"
        activeOpacity={0.85}
        style={[styles.trigger, triggerStyle]}
        onPress={present}
      >
        <AppText numberOfLines={1} style={styles.triggerText}>
          {formatCustomCadenceLabel(count, interval)}
        </AppText>
        <Ionicons color={colors.textMuted} name="chevron-down" size={20} />
      </TouchableOpacity>
      {host}
    </View>
  );
}
