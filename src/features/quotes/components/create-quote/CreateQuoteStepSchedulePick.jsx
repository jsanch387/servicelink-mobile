import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, TimeSelectField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { formatScheduledDateUserFacing } from '../../utils/formatScheduledDateDisplay';

function parseYyyyMmDdToLocalDate(yyyyMmDd) {
  const s = String(yyyyMmDd ?? '').trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? new Date() : dt;
}

function formatLocalDateToYyyyMmDd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const y = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${month}-${day}`;
}

function normalizePickerDate(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
  }
  if (raw == null) {
    return null;
  }
  if (typeof raw === 'number') {
    const byNumber = new Date(raw);
    if (!Number.isNaN(byNumber.getTime())) return byNumber;
  }
  if (typeof raw === 'string') {
    const byString = new Date(raw);
    if (!Number.isNaN(byString.getTime())) return byString;
  }
  if (raw && typeof raw === 'object') {
    const ts = raw.timestamp ?? raw?.nativeEvent?.timestamp ?? raw?.value ?? raw?.date ?? null;
    if (typeof ts === 'number' || typeof ts === 'string') {
      const byTs = new Date(ts);
      if (!Number.isNaN(byTs.getTime())) return byTs;
    }
  }
  return null;
}

/**
 * Calendar + start time for an owner-proposed quote schedule.
 *
 * @param {object} props
 * @param {string} props.scheduledDateYyyyMmDd
 * @param {(t: string) => void} props.onScheduledDateChange
 * @param {string} props.scheduledStartTime12h
 * @param {(t: string) => void} props.onScheduledStartTimeChange
 */
export function CreateQuoteStepSchedulePick({
  scheduledDateYyyyMmDd,
  onScheduledDateChange,
  scheduledStartTime12h,
  onScheduledStartTimeChange,
}) {
  const { colors } = useTheme();
  const [androidPickerOpen, setAndroidPickerOpen] = useState(false);

  const dateValue = useMemo(
    () => parseYyyyMmDdToLocalDate(scheduledDateYyyyMmDd),
    [scheduledDateYyyyMmDd],
  );

  const dateDisplay = useMemo(
    () => formatScheduledDateUserFacing(scheduledDateYyyyMmDd),
    [scheduledDateYyyyMmDd],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sectionLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.2,
          marginBottom: 8,
          marginTop: 4,
          textTransform: 'uppercase',
        },
        androidDateRow: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 10,
          marginBottom: 8,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        androidDateText: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
        },
        calendarWrap: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1,
          marginBottom: 16,
          overflow: 'hidden',
          paddingBottom: 4,
          paddingTop: 4,
        },
        timeBlock: {
          marginTop: 4,
        },
      }),
    [colors],
  );

  function handleDateValueChange(_event, nextDateLike) {
    if (Platform.OS === 'android') {
      setAndroidPickerOpen(false);
    }
    const next =
      nextDateLike instanceof Date && !Number.isNaN(nextDateLike.getTime())
        ? nextDateLike
        : normalizePickerDate(nextDateLike);
    if (!next) return;
    onScheduledDateChange(formatLocalDateToYyyyMmDd(next));
  }

  return (
    <View>
      <AppText style={styles.sectionLabel}>Date</AppText>
      {Platform.OS === 'ios' ? (
        <View style={styles.calendarWrap}>
          <DateTimePicker
            display="inline"
            mode="date"
            value={dateValue}
            onValueChange={handleDateValueChange}
          />
        </View>
      ) : (
        <>
          <Pressable
            accessibilityHint="Opens the calendar"
            accessibilityLabel="Change date"
            accessibilityRole="button"
            style={styles.androidDateRow}
            onPress={() => setAndroidPickerOpen(true)}
          >
            <Ionicons color={colors.accent} name="calendar" size={20} />
            <AppText style={styles.androidDateText}>{dateDisplay || 'Pick a day'}</AppText>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
          </Pressable>
          {androidPickerOpen ? (
            <DateTimePicker
              display="calendar"
              mode="date"
              value={dateValue}
              onValueChange={handleDateValueChange}
            />
          ) : null}
        </>
      )}

      <View style={styles.timeBlock}>
        <AppText style={styles.sectionLabel}>Start time</AppText>
        <TimeSelectField
          placeholder="Select time"
          title="Start time"
          value={scheduledStartTime12h}
          onValueChange={onScheduledStartTimeChange}
        />
      </View>
    </View>
  );
}
