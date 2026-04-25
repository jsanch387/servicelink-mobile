import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const HOURS = Array.from({ length: 11 }, (_, i) => String(i));
const MINUTES = ['00', '30'];
const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const SPACER_ROWS = 2;

function paddedValues(values) {
  return [...Array(SPACER_ROWS).fill(null), ...values, ...Array(SPACER_ROWS).fill(null)];
}

function getValueIndexFromOffset(offsetY, valuesLength) {
  const rawIndex = Math.round(Math.max(0, offsetY) / ITEM_HEIGHT);
  return Math.min(valuesLength - 1, Math.max(0, rawIndex));
}

function buildSnapHandler({ values, setValue, listRef }) {
  return (offsetY) => {
    const valueIndex = getValueIndexFromOffset(offsetY, values.length);
    const nextValue = values[valueIndex];
    const snappedOffset = valueIndex * ITEM_HEIGHT;
    setValue(nextValue);
    listRef.current?.scrollToOffset({ animated: false, offset: snappedOffset });
  };
}

export function DurationSelectField({
  value,
  onValueChange,
  placeholder = 'Select duration',
  label = 'Duration',
  triggerStyle,
  containerStyle,
  /** `'addon'`: optional extra time (0 = none); `'service'`: core duration (30+ min). */
  mode = 'service',
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);

  const [draftHour, setDraftHour] = useState(() => (mode === 'addon' ? '0' : '1'));
  const [draftMinute, setDraftMinute] = useState('00');
  const paddedHours = useMemo(() => paddedValues(HOURS), []);
  const paddedMinutes = useMemo(() => paddedValues(MINUTES), []);
  const snapHour = useMemo(
    () => buildSnapHandler({ values: HOURS, setValue: setDraftHour, listRef: hoursRef }),
    [],
  );
  const snapMinute = useMemo(
    () => buildSnapHandler({ values: MINUTES, setValue: setDraftMinute, listRef: minutesRef }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const hourIndex = HOURS.findIndex((h) => h === draftHour);
    const minuteIndex = MINUTES.findIndex((m) => m === draftMinute);
    requestAnimationFrame(() => {
      hoursRef.current?.scrollToOffset({
        animated: false,
        offset: Math.max(0, hourIndex * ITEM_HEIGHT),
      });
      minutesRef.current?.scrollToOffset({
        animated: false,
        offset: Math.max(0, minuteIndex * ITEM_HEIGHT),
      });
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- draft set in openSheet; scroll only on open

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

  function openSheet() {
    if (mode === 'addon') {
      const trimmed = String(value ?? '').trim();
      const base = trimmed ? normalizeAddonDurationHHmmForPicker(trimmed) || '00:30' : '00:00';
      const [h = '00', m = '00'] = base.split(':');
      setDraftHour(String(Math.min(10, Math.max(0, parseInt(h, 10) || 0))));
      setDraftMinute(m === '30' ? '30' : '00');
      setOpen(true);
      return;
    }
    const base = String(value ?? '').trim()
      ? normalizeServiceDurationHHmm(value) || '01:00'
      : '01:00';
    const [h = '01', m = '00'] = base.split(':');
    setDraftHour(String(Math.min(10, Math.max(0, parseInt(h, 10) || 1))));
    setDraftMinute(m === '30' ? '30' : '00');
    setOpen(true);
  }

  function applySelection() {
    let total = (parseInt(draftHour, 10) || 0) * 60 + (draftMinute === '30' ? 30 : 0);
    if (mode === 'addon') {
      if (total <= 0) {
        onValueChange('');
        setOpen(false);
        return;
      }
      total = Math.max(SERVICE_DURATION_MIN_MINUTES, Math.min(SERVICE_DURATION_MAX_MINUTES, total));
      const h = Math.floor(total / 60);
      const m = total % 60;
      onValueChange(`${String(h).padStart(2, '0')}:${m === 30 ? '30' : '00'}`);
      setOpen(false);
      return;
    }
    total = Math.max(SERVICE_DURATION_MIN_MINUTES, Math.min(SERVICE_DURATION_MAX_MINUTES, total));
    const h = Math.floor(total / 60);
    const m = total % 60;
    onValueChange(`${String(h).padStart(2, '0')}:${m === 30 ? '30' : '00'}`);
    setOpen(false);
  }

  return (
    <View style={[styles.field, containerStyle]}>
      <AppText style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</AppText>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={openSheet}
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
            { color: String(value ?? '').trim() ? colors.text : colors.placeholder },
          ]}
        >
          {display}
        </AppText>
        <Ionicons color={colors.textMuted} name="chevron-down" size={22} />
      </TouchableOpacity>

      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOpen(false)}
          style={styles.backdrop}
        />

        <View
          style={[
            styles.sheetWrap,
            {
              backgroundColor: colors.shellElevated,
              borderTopColor: colors.borderStrong,
              paddingBottom: Math.max(insets.bottom, 14) + 8,
            },
          ]}
        >
          <View style={styles.sheet}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <AppText style={[styles.sheetTitle, { color: colors.textMuted }]}>
                Select duration
              </AppText>
              <TouchableOpacity hitSlop={8} onPress={() => setOpen(false)}>
                <Ionicons color={colors.textMuted} name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.dialsRow}>
              <View style={styles.wheelContainer}>
                <View
                  pointerEvents="none"
                  style={[styles.wheelHighlight, { backgroundColor: colors.buttonGhostPressed }]}
                />
                <FlatList
                  data={paddedHours}
                  decelerationRate="fast"
                  getItemLayout={(_, index) => ({
                    index,
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                  })}
                  keyExtractor={(item, index) => `${item ?? 'h-spacer'}-${index}`}
                  ref={hoursRef}
                  renderItem={({ item }) => (
                    <View style={styles.dialItem}>
                      <AppText
                        style={[
                          styles.dialItemText,
                          { color: item === draftHour ? colors.text : colors.textMuted },
                        ]}
                      >
                        {item ?? ''}
                      </AppText>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={(e) => snapHour(e.nativeEvent.contentOffset.y)}
                  onScroll={(e) => {
                    const idx = getValueIndexFromOffset(
                      e.nativeEvent.contentOffset.y,
                      HOURS.length,
                    );
                    setDraftHour(HOURS[idx]);
                  }}
                  onScrollEndDrag={(e) => {
                    snapHour(e.nativeEvent.contentOffset.y);
                  }}
                  scrollEventThrottle={16}
                  style={styles.wheelList}
                />
              </View>

              <AppText style={[styles.colon, { color: colors.textMuted }]}>:</AppText>

              <View style={[styles.wheelContainer, styles.minuteWheel]}>
                <View
                  pointerEvents="none"
                  style={[styles.wheelHighlight, { backgroundColor: colors.buttonGhostPressed }]}
                />
                <FlatList
                  data={paddedMinutes}
                  decelerationRate="fast"
                  getItemLayout={(_, index) => ({
                    index,
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                  })}
                  keyExtractor={(item, index) => `${item ?? 'm-spacer'}-${index}`}
                  ref={minutesRef}
                  renderItem={({ item }) => (
                    <View style={styles.dialItem}>
                      <AppText
                        style={[
                          styles.dialItemText,
                          { color: item === draftMinute ? colors.text : colors.textMuted },
                        ]}
                      >
                        {item ?? ''}
                      </AppText>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={ITEM_HEIGHT}
                  onMomentumScrollEnd={(e) => snapMinute(e.nativeEvent.contentOffset.y)}
                  onScroll={(e) => {
                    const idx = getValueIndexFromOffset(
                      e.nativeEvent.contentOffset.y,
                      MINUTES.length,
                    );
                    setDraftMinute(MINUTES[idx]);
                  }}
                  onScrollEndDrag={(e) => {
                    snapMinute(e.nativeEvent.contentOffset.y);
                  }}
                  scrollEventThrottle={16}
                  style={styles.wheelList}
                />
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={applySelection} style={styles.cta}>
              <AppText style={styles.ctaText}>Set duration</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 15,
    fontWeight: '500',
    minHeight: 34,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 8,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.60)' },
  sheetWrap: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  sheet: {
    paddingBottom: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetTitle: { fontSize: 14, fontWeight: '500' },
  dialsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  wheelContainer: {
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    justifyContent: 'center',
    width: 84,
  },
  minuteWheel: {
    width: 76,
  },
  wheelList: {
    flexGrow: 0,
  },
  wheelHighlight: {
    borderRadius: 10,
    height: ITEM_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: ITEM_HEIGHT * SPACER_ROWS,
  },
  dialItem: { alignItems: 'center', height: ITEM_HEIGHT, justifyContent: 'center' },
  dialItemText: { fontSize: 18, fontWeight: '500' },
  colon: { fontSize: 20, fontWeight: '500', textAlign: 'center', width: 16 },
  cta: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 4,
  },
  ctaText: { color: '#000000', fontSize: 16, fontWeight: '600' },
});
