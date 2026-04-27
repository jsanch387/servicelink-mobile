import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppText, BottomSheetModal, Button, TimeSelectField } from '../../../components/ui';
import { useTheme } from '../../../theme';

function formatDateForDisplay(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return 'Select date';
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateForPayload(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateValue(raw) {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw;
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

export function TimeOffSheet({ visible, onRequestClose, onAddTimeOff }) {
  const { colors } = useTheme();
  const [dateValue, setDateValue] = useState(() => new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState('9:00 AM');
  const [endTime, setEndTime] = useState('5:00 PM');

  useEffect(() => {
    if (!visible) return;
    setDateValue(new Date());
    setShowDatePicker(false);
    setStartTime('9:00 AM');
    setEndTime('5:00 PM');
  }, [visible]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        field: {
          marginBottom: 14,
        },
        dateTrigger: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.inputBorder,
          borderRadius: 16,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 40,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        dateTriggerText: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          minHeight: 34,
          paddingLeft: 6,
          paddingRight: 10,
          paddingVertical: 8,
        },
        pickerInlineWrap: {
          marginTop: 8,
        },
        actions: {
          flexDirection: 'row',
          gap: 10,
          marginTop: 20,
        },
        actionBtn: {
          flex: 1,
        },
      }),
    [colors],
  );

  const dateLabel = useMemo(() => formatDateForDisplay(dateValue), [dateValue]);
  const canSave = Boolean(startTime && endTime);

  function handleDateValueChange(nextDateLike) {
    const nextDate = normalizeDateValue(nextDateLike);
    if (!nextDate) return;
    setDateValue(nextDate);
  }

  function handleDateDismiss() {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
  }

  function handleAddTimeOff() {
    if (!canSave) return;
    onAddTimeOff?.({
      date: formatDateForPayload(dateValue),
      start_time: startTime,
      end_time: endTime,
    });
    onRequestClose?.();
  }

  return (
    <BottomSheetModal
      allowBackdropClose
      maxHeight="96%"
      minHeight="88%"
      title="Add time off"
      visible={visible}
      onRequestClose={onRequestClose}
      footer={
        <View style={styles.actions}>
          <Button
            fullWidth
            labelColor="#ffffff"
            outlineColor="rgba(255,255,255,0.52)"
            style={styles.actionBtn}
            title="Cancel"
            variant="outline"
            onPress={onRequestClose}
          />
          <Button
            disabled={!canSave}
            fullWidth
            style={styles.actionBtn}
            title="Add time off"
            variant="surfaceLight"
            onPress={handleAddTimeOff}
          />
        </View>
      }
    >
      <Pressable style={styles.dateTrigger} onPress={() => setShowDatePicker(true)}>
        <AppText style={styles.dateTriggerText}>{dateLabel}</AppText>
        <Ionicons color={colors.textMuted} name="calendar-outline" size={20} />
      </Pressable>
      {showDatePicker ? (
        <View style={styles.pickerInlineWrap}>
          <DateTimePicker
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            mode="date"
            value={dateValue}
            onDismiss={handleDateDismiss}
            onValueChange={handleDateValueChange}
          />
        </View>
      ) : null}
      <View style={styles.field} />
      <TimeSelectField
        placeholder="Start time"
        title="Select start time"
        value={startTime}
        onValueChange={setStartTime}
      />
      <View style={styles.field} />
      <TimeSelectField
        placeholder="End time"
        title="Select end time"
        value={endTime}
        onValueChange={setEndTime}
      />
    </BottomSheetModal>
  );
}
