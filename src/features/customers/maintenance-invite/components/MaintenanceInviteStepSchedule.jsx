import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SurfaceTextField, TimeSelectField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { MaintenanceInviteFieldLabel } from './MaintenanceInviteFieldLabel';
import { MaintenanceInviteFieldStack } from './MaintenanceInviteFieldStack';
import { formatPreferredDateMmDdYyyy } from '../utils/formatPreferredDateDisplay';
import {
  formatLocalDateToYyyyMmDd,
  normalizePickerDate,
  parseYyyyMmDdToLocalDate,
} from '../utils/maintenanceInviteFormUtils';

const FIELD_SHELL = { marginBottom: 0 };

/**
 * @param {object} props
 * @param {string} props.preferredDateYyyyMmDd
 * @param {(t: string) => void} props.onPreferredDateChange
 * @param {string} props.preferredTime12h
 * @param {(t: string) => void} props.onPreferredTimeChange
 */
export function MaintenanceInviteStepSchedule({
  preferredDateYyyyMmDd,
  onPreferredDateChange,
  preferredTime12h,
  onPreferredTimeChange,
}) {
  const { colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const dateValue = useMemo(
    () => parseYyyyMmDdToLocalDate(preferredDateYyyyMmDd),
    [preferredDateYyyyMmDd],
  );

  const dateDisplay = useMemo(
    () => formatPreferredDateMmDdYyyy(preferredDateYyyyMmDd),
    [preferredDateYyyyMmDd],
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
        pickerWrap: {
          marginTop: 12,
          overflow: 'hidden',
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
    onPreferredDateChange(formatLocalDateToYyyyMmDd(next));
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
    <MaintenanceInviteFieldStack>
      <View>
        <SurfaceTextField
          autoCapitalize="none"
          containerStyle={FIELD_SHELL}
          editable={false}
          label="Date"
          placeholder="Choose date"
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

      <View>
        <View style={{ marginBottom: 8 }}>
          <MaintenanceInviteFieldLabel text="Time" />
        </View>
        <TimeSelectField
          placeholder="Select time"
          title="Time"
          value={preferredTime12h}
          onValueChange={onPreferredTimeChange}
        />
      </View>
    </MaintenanceInviteFieldStack>
  );
}
