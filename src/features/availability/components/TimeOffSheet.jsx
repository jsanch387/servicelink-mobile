import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import {
  AppText,
  BottomSheetModal,
  Button,
  SurfaceCard,
  SurfaceTextField,
  TimeSelectField,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { BookingCalendarCard } from '../booking';
import {
  advanceTimeOffDateSelection,
  TIME_OFF_ALL_DAY_END,
  TIME_OFF_ALL_DAY_START,
} from '../utils/availabilityModel';

const NOTE_MAX_LEN = 120;
const SWITCH_ON_TRACK = '#10b981';

/**
 * @param {string | null | undefined} rawDate YYYY-MM-DD
 */
function formatDateShort(rawDate) {
  const raw = String(rawDate ?? '').trim();
  if (!raw) return '';
  const parsed = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * @param {string | null} startKey
 * @param {string | null} endKey
 */
function formatSelectionSummary(startKey, endKey) {
  if (!startKey) return '';
  const startLabel = formatDateShort(startKey);
  if (!endKey || endKey === startKey) return startLabel;
  return `${startLabel} – ${formatDateShort(endKey)}`;
}

export function TimeOffSheet({ visible, onRequestClose, onAddTimeOff }) {
  const { colors } = useTheme();
  const [rangeStartKey, setRangeStartKey] = useState(/** @type {string | null} */ (null));
  const [rangeEndKey, setRangeEndKey] = useState(/** @type {string | null} */ (null));
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('9:00 AM');
  const [endTime, setEndTime] = useState('5:00 PM');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    setRangeStartKey(null);
    setRangeEndKey(null);
    setAllDay(true);
    setStartTime('9:00 AM');
    setEndTime('5:00 PM');
    setNote('');
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: 20,
        },
        sectionTight: {
          marginBottom: 12,
        },
        fieldLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          marginBottom: 6,
        },
        datesHeader: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 12,
        },
        datesCopy: {
          flex: 1,
          minWidth: 0,
        },
        summary: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        fieldHint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        clearHit: {
          paddingHorizontal: 2,
          paddingVertical: 4,
        },
        clearLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
        },
        optionsCard: {
          borderRadius: 14,
          overflow: 'hidden',
          paddingHorizontal: 14,
          paddingVertical: 4,
        },
        optionRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingVertical: 12,
        },
        optionCopy: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 12,
        },
        optionLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
        optionHint: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
        },
        switchWrap: {
          justifyContent: 'center',
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
        },
        timesBlock: {
          flexDirection: 'row',
          gap: 10,
          paddingBottom: 12,
          paddingTop: 10,
        },
        timeField: {
          flex: 1,
          gap: 6,
          minWidth: 0,
        },
        timeLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
        footer: {
          flexDirection: 'row',
          gap: 10,
        },
        footerBtn: {
          flex: 1,
        },
      }),
    [colors],
  );

  const hasDateSelection = Boolean(rangeStartKey);
  const resolvedEndKey = rangeEndKey || rangeStartKey;
  const canSave = hasDateSelection && (allDay || Boolean(startTime && endTime));
  const selectionSummary = formatSelectionSummary(rangeStartKey, rangeEndKey);

  function handleSelectDateKey(key) {
    const next = advanceTimeOffDateSelection(rangeStartKey, rangeEndKey, key);
    setRangeStartKey(next.startKey);
    setRangeEndKey(next.endKey);
  }

  function handleClearDates() {
    setRangeStartKey(null);
    setRangeEndKey(null);
  }

  function handleAddTimeOff() {
    if (!canSave || !rangeStartKey || !resolvedEndKey) return;
    onAddTimeOff?.({
      start_date: rangeStartKey,
      end_date: resolvedEndKey,
      date: rangeStartKey === resolvedEndKey ? rangeStartKey : undefined,
      all_day: allDay,
      start_time: allDay ? TIME_OFF_ALL_DAY_START : startTime,
      end_time: allDay ? TIME_OFF_ALL_DAY_END : endTime,
      title: note.trim(),
    });
    onRequestClose?.();
  }

  return (
    <BottomSheetModal
      allowBackdropClose
      liftFooterWithKeyboard={false}
      sheetHeightPercent={92}
      stickyFooter
      title="Add time off"
      visible={visible}
      onRequestClose={onRequestClose}
      footer={
        <View style={styles.footer}>
          <View style={styles.footerBtn}>
            <Button fullWidth title="Cancel" variant="secondary" onPress={onRequestClose} />
          </View>
          <View style={styles.footerBtn}>
            <Button
              disabled={!canSave}
              fullWidth
              title="Save"
              variant="surfaceLight"
              onPress={handleAddTimeOff}
            />
          </View>
        </View>
      }
    >
      <View style={styles.section}>
        <AppText style={styles.fieldLabel}>Dates</AppText>
        <View style={styles.datesHeader}>
          <View style={styles.datesCopy}>
            {hasDateSelection ? (
              <AppText style={styles.summary}>{selectionSummary}</AppText>
            ) : (
              <AppText style={styles.fieldHint}>Tap a day, or two days for a range</AppText>
            )}
          </View>
          {hasDateSelection ? (
            <Pressable
              accessibilityLabel="Clear dates"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.clearHit}
              onPress={handleClearDates}
            >
              <AppText style={styles.clearLabel}>Clear</AppText>
            </Pressable>
          ) : null}
        </View>
        <BookingCalendarCard
          cardStyle={{ marginBottom: 0 }}
          rangeEndKey={rangeEndKey}
          rangeStartKey={rangeStartKey}
          selectionMode="range"
          onSelectDateKey={handleSelectDateKey}
        />
      </View>

      <View style={styles.sectionTight}>
        <AppText style={styles.fieldLabel}>Hours</AppText>
        <SurfaceCard style={styles.optionsCard}>
          <View style={styles.optionRow}>
            <View style={styles.optionCopy}>
              <AppText style={styles.optionLabel}>All day</AppText>
              <AppText style={styles.optionHint}>Unavailable the entire day</AppText>
            </View>
            <View style={styles.switchWrap}>
              <Switch
                accessibilityLabel="All day"
                thumbColor={allDay ? '#f8fafc' : '#f4f4f5'}
                trackColor={{ false: colors.borderStrong, true: SWITCH_ON_TRACK }}
                value={allDay}
                onValueChange={setAllDay}
              />
            </View>
          </View>

          {!allDay ? (
            <>
              <View style={styles.divider} />
              <View style={styles.timesBlock}>
                <View style={styles.timeField}>
                  <AppText style={styles.timeLabel}>Start</AppText>
                  <TimeSelectField
                    placeholder="Start"
                    title="Select start time"
                    value={startTime}
                    onValueChange={setStartTime}
                  />
                </View>
                <View style={styles.timeField}>
                  <AppText style={styles.timeLabel}>End</AppText>
                  <TimeSelectField
                    placeholder="End"
                    title="Select end time"
                    value={endTime}
                    onValueChange={setEndTime}
                  />
                </View>
              </View>
            </>
          ) : null}
        </SurfaceCard>
      </View>

      <View>
        <SurfaceTextField
          compact
          containerStyle={{ marginBottom: 0 }}
          label="Note"
          maxLength={NOTE_MAX_LEN}
          placeholder="e.g. Vacation"
          value={note}
          onChangeText={setNote}
        />
      </View>
    </BottomSheetModal>
  );
}
