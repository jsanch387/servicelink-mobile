import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SurfaceTextField, TimeSelectField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { formatScheduledDateUserFacing } from '../../utils/formatScheduledDateDisplay';
import { CreateQuoteFieldStack } from './CreateQuoteFieldStack';
import { QuoteRequiredFieldLabel } from './QuoteRequiredFieldLabel';

const FIELD_SHELL = { marginBottom: 0 };

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
 * @param {object} props
 * @param {string} props.scheduledDateYyyyMmDd
 * @param {(t: string) => void} props.onScheduledDateChange
 * @param {string} props.scheduledStartTime12h
 * @param {(t: string) => void} props.onScheduledStartTimeChange
 */
export function CreateQuoteStepSchedule({
  scheduledDateYyyyMmDd,
  onScheduledDateChange,
  scheduledStartTime12h,
  onScheduledStartTimeChange,
}) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        calendarHit: {
          alignItems: 'center',
          height: 40,
          justifyContent: 'center',
          marginLeft: 2,
          width: 40,
        },
        dateBlock: {
          marginBottom: 0,
        },
        pickerWrap: {
          marginTop: 12,
          overflow: 'hidden',
        },
        timeFieldLabelWrap: {
          marginBottom: 10,
        },
        timeFieldBlock: {
          marginBottom: 0,
        },
      }),
    [],
  );

  function handleDateDismiss() {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  }

  function handleDateValueChange(_event, nextDateLike) {
    const next =
      nextDateLike instanceof Date && !Number.isNaN(nextDateLike.getTime())
        ? nextDateLike
        : normalizePickerDate(nextDateLike);
    if (!next) return;
    onScheduledDateChange(formatLocalDateToYyyyMmDd(next));
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  }

  function handleCalendarPress() {
    if (Platform.OS === 'android') {
      setShowDatePicker(true);
    } else {
      setShowDatePicker((open) => !open);
    }
  }

  return (
    <CreateQuoteFieldStack>
      <View style={styles.dateBlock}>
        <SurfaceTextField
          autoCapitalize="none"
          containerStyle={FIELD_SHELL}
          editable={false}
          label={<QuoteRequiredFieldLabel text="Scheduled date" />}
          placeholder="Choose a date"
          rightAccessory={
            <Pressable
              accessibilityLabel="Open calendar"
              accessibilityRole="button"
              hitSlop={8}
              style={styles.calendarHit}
              onPress={handleCalendarPress}
            >
              <Ionicons color={colors.textMuted} name="calendar-outline" size={22} />
            </Pressable>
          }
          value={dateDisplay}
          onChangeText={() => {}}
          onShellPress={handleCalendarPress}
        />
        {showDatePicker ? (
          <View style={Platform.OS === 'ios' ? styles.pickerWrap : undefined}>
            <DateTimePicker
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              mode="date"
              value={dateValue}
              onDismiss={handleDateDismiss}
              onValueChange={handleDateValueChange}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.timeFieldBlock}>
        <View style={styles.timeFieldLabelWrap}>
          <QuoteRequiredFieldLabel compact text="Start time" />
        </View>
        <TimeSelectField
          placeholder="Select time"
          title="Start time"
          value={scheduledStartTime12h}
          onValueChange={onScheduledStartTimeChange}
        />
      </View>
    </CreateQuoteFieldStack>
  );
}
