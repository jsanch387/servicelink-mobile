import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import {
  formatAddonDurationFromHHmm,
  formatServiceDurationSelectLabel,
  normalizeAddonDurationHHmmForPicker,
  normalizeServiceDurationHHmm,
  serviceDurationHHmmToMinutes,
  SERVICE_DURATION_MAX_MINUTES,
  SERVICE_DURATION_MIN_MINUTES,
} from './durationTime';
import {
  useWheelPickerSheet,
  WHEEL_ITEM_HEIGHT,
  WheelColumn,
  WheelPickerSheetShell,
} from './wheelPicker';

const HOURS = Array.from({ length: 11 }, (_, i) => String(i));
const MINUTES = ['00', '30'];

function resolveDraftFromValue(value, mode) {
  if (mode === 'addon') {
    const trimmed = String(value ?? '').trim();
    const base = trimmed ? normalizeAddonDurationHHmmForPicker(trimmed) || '00:30' : '00:00';
    const [h = '00', m = '00'] = base.split(':');
    return {
      hour: String(Math.min(10, Math.max(0, parseInt(h, 10) || 0))),
      minute: m === '30' ? '30' : '00',
    };
  }
  const base = String(value ?? '').trim()
    ? normalizeServiceDurationHHmm(value) || '01:00'
    : '01:00';
  const [h = '01', m = '00'] = base.split(':');
  return {
    hour: String(Math.min(10, Math.max(0, parseInt(h, 10) || 1))),
    minute: m === '30' ? '30' : '00',
  };
}

function DurationPickerSheet({
  mode,
  initialHour,
  initialMinute,
  onRequestClose,
  onConfirm,
  sheetStyle,
  backdropStyle,
}) {
  const { colors } = useTheme();
  const [draftHour, setDraftHour] = useState(initialHour);
  const [draftMinute, setDraftMinute] = useState(initialMinute);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  useEffect(() => {
    const hourIndex = Math.max(
      0,
      HOURS.findIndex((h) => h === initialHour),
    );
    const minuteIndex = Math.max(
      0,
      MINUTES.findIndex((m) => m === initialMinute),
    );
    const applyScroll = () => {
      hoursRef.current?.scrollTo({ animated: false, y: hourIndex * WHEEL_ITEM_HEIGHT });
      minutesRef.current?.scrollTo({ animated: false, y: minuteIndex * WHEEL_ITEM_HEIGHT });
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(applyScroll);
    });
  }, [initialHour, initialMinute]);

  function applySelection() {
    let total = (parseInt(draftHour, 10) || 0) * 60 + (draftMinute === '30' ? 30 : 0);
    if (mode === 'addon' && total <= 0) {
      onConfirm('');
      return;
    }
    total = Math.max(SERVICE_DURATION_MIN_MINUTES, Math.min(SERVICE_DURATION_MAX_MINUTES, total));
    const h = Math.floor(total / 60);
    const m = total % 60;
    onConfirm(`${String(h).padStart(2, '0')}:${m === 30 ? '30' : '00'}`);
  }

  return (
    <WheelPickerSheetShell
      backdropStyle={backdropStyle}
      confirmTitle="Set duration"
      sheetStyle={sheetStyle}
      title="Select duration"
      onConfirm={applySelection}
      onRequestClose={onRequestClose}
    >
      <View style={styles.dialsRow}>
        <WheelColumn
          listRef={hoursRef}
          selected={draftHour}
          values={HOURS}
          onSelectedChange={setDraftHour}
        />
        <AppText style={[styles.colon, { color: colors.textMuted }]}>:</AppText>
        <WheelColumn
          listRef={minutesRef}
          selected={draftMinute}
          values={MINUTES}
          wheelStyle={styles.minuteWheel}
          onSelectedChange={setDraftMinute}
        />
      </View>
    </WheelPickerSheetShell>
  );
}

export function DurationSelectField({
  value,
  onValueChange,
  placeholder = 'Select duration',
  label = 'Duration',
  triggerStyle,
  containerStyle,
  /** Tighter rhythm for side-by-side fields (e.g. price + duration row). */
  compact = false,
  /** `'addon'`: optional extra time (0 = none); `'service'`: core duration (30+ min). */
  mode = 'service',
}) {
  const { colors } = useTheme();
  const draftRef = useRef({ hour: '1', minute: '00' });
  draftRef.current = resolveDraftFromValue(value, mode);

  const { host, present } = useWheelPickerSheet(({ backdropStyle, close, sheetStyle }) => (
    <DurationPickerSheet
      backdropStyle={backdropStyle}
      initialHour={draftRef.current.hour}
      initialMinute={draftRef.current.minute}
      mode={mode}
      sheetStyle={sheetStyle}
      onConfirm={(next) => {
        onValueChange(next);
        close();
      }}
      onRequestClose={close}
    />
  ));

  const display = useMemo(() => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) return placeholder;
    if (mode === 'addon') {
      const mins = serviceDurationHHmmToMinutes(trimmed);
      if (mins <= 0) return placeholder;
      return formatAddonDurationFromHHmm(trimmed);
    }
    return formatServiceDurationSelectLabel(normalizeServiceDurationHHmm(value) || value);
  }, [value, mode, placeholder]);

  return (
    <View style={[styles.field, compact && styles.fieldCompact, containerStyle]}>
      {label ? (
        typeof label === 'string' ? (
          <AppText
            style={[
              styles.fieldLabel,
              compact && styles.fieldLabelCompact,
              { color: colors.textMuted },
            ]}
          >
            {label}
          </AppText>
        ) : (
          <View style={[styles.fieldLabelNodeWrap, compact && styles.fieldLabelCompact]}>
            {label}
          </View>
        )
      ) : null}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={present}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.cardSurface,
            borderColor: colors.inputBorder,
          },
          triggerStyle,
        ]}
      >
        <AppText
          style={[
            styles.triggerText,
            compact && styles.triggerTextCompact,
            { color: String(value ?? '').trim() ? colors.text : colors.placeholder },
          ]}
        >
          {display}
        </AppText>
        <Ionicons color={colors.textMuted} name="chevron-down" size={22} />
      </TouchableOpacity>

      {host}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 14,
  },
  fieldCompact: {
    marginTop: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldLabelCompact: {
    marginBottom: 6,
  },
  fieldLabelNodeWrap: {
    marginBottom: 8,
  },
  trigger: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    minHeight: 34,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 8,
  },
  triggerTextCompact: {
    minHeight: 36,
    paddingVertical: 6,
  },
  dialsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  minuteWheel: {
    width: 76,
  },
  colon: { fontSize: 20, fontWeight: '500', textAlign: 'center', width: 16 },
});
