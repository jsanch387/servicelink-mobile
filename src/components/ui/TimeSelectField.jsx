import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '30'];
const PERIODS = ['AM', 'PM'];
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

function buildSnapHandler({ values, setValue }) {
  return (offsetY) => {
    const valueIndex = getValueIndexFromOffset(offsetY, values.length);
    const nextValue = values[valueIndex];
    setValue(nextValue);
  };
}

function parseTime(value) {
  const raw = String(value ?? '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: '9', minute: '00', period: 'AM' };
  const hourNum = Number(match[1]);
  const minute = match[2] === '30' ? '30' : '00';
  const period = match[3].toUpperCase() === 'PM' ? 'PM' : 'AM';
  const normalizedHour = String(Math.min(12, Math.max(1, hourNum || 9)));
  return { hour: normalizedHour, minute, period };
}

function formatTime(hour, minute, period) {
  return `${hour}:${minute} ${period}`;
}

export function TimeSelectField({
  value,
  onValueChange,
  placeholder = 'Select time',
  title = 'Select time',
  triggerStyle,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const periodsRef = useRef(null);

  const [draftHour, setDraftHour] = useState('9');
  const [draftMinute, setDraftMinute] = useState('00');
  const [draftPeriod, setDraftPeriod] = useState('AM');

  const paddedHours = useMemo(() => paddedValues(HOURS), []);
  const paddedMinutes = useMemo(() => paddedValues(MINUTES), []);
  const paddedPeriods = useMemo(() => paddedValues(PERIODS), []);

  const snapHour = useMemo(() => buildSnapHandler({ values: HOURS, setValue: setDraftHour }), []);
  const snapMinute = useMemo(
    () => buildSnapHandler({ values: MINUTES, setValue: setDraftMinute }),
    [],
  );
  const snapPeriod = useMemo(
    () => buildSnapHandler({ values: PERIODS, setValue: setDraftPeriod }),
    [],
  );

  useEffect(() => {
    if (!open) return;
    const hourIndex = HOURS.findIndex((h) => h === draftHour);
    const minuteIndex = MINUTES.findIndex((m) => m === draftMinute);
    const periodIndex = PERIODS.findIndex((p) => p === draftPeriod);
    requestAnimationFrame(() => {
      hoursRef.current?.scrollToOffset({
        animated: false,
        offset: Math.max(0, hourIndex * ITEM_HEIGHT),
      });
      minutesRef.current?.scrollToOffset({
        animated: false,
        offset: Math.max(0, minuteIndex * ITEM_HEIGHT),
      });
      periodsRef.current?.scrollToOffset({
        animated: false,
        offset: Math.max(0, periodIndex * ITEM_HEIGHT),
      });
    });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- draft values are seeded in openSheet; only initialize scroll positions on open

  const display = useMemo(() => {
    const trimmed = String(value ?? '').trim();
    return trimmed || placeholder;
  }, [value, placeholder]);

  function openSheet() {
    const parsed = parseTime(value);
    setDraftHour(parsed.hour);
    setDraftMinute(parsed.minute);
    setDraftPeriod(parsed.period);
    setOpen(true);
  }

  function applySelection() {
    onValueChange(formatTime(draftHour, draftMinute, draftPeriod));
    setOpen(false);
  }

  function renderWheel({ values, draftValue, paddedData, listRef, onSnap, width }) {
    return (
      <View style={[styles.wheelContainer, { width }]}>
        <View
          pointerEvents="none"
          style={[styles.wheelHighlight, { backgroundColor: colors.buttonGhostPressed }]}
        />
        <FlatList
          bounces={false}
          data={paddedData}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({
            index,
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
          })}
          keyExtractor={(item, index) => `${item ?? 'spacer'}-${index}`}
          ref={listRef}
          renderItem={({ item }) => (
            <View style={styles.dialItem}>
              <AppText
                style={[
                  styles.dialItemText,
                  { color: item === draftValue ? colors.text : colors.textMuted },
                ]}
              >
                {item ?? ''}
              </AppText>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          onMomentumScrollEnd={(e) => onSnap(e.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(e) => onSnap(e.nativeEvent.contentOffset.y)}
          style={styles.wheelList}
        />
      </View>
    );
  }

  return (
    <View>
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
        <Ionicons color={colors.textMuted} name="chevron-down" size={20} />
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
              <AppText style={[styles.sheetTitle, { color: colors.textMuted }]}>{title}</AppText>
              <TouchableOpacity hitSlop={8} onPress={() => setOpen(false)}>
                <Ionicons color={colors.textMuted} name="close" size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.dialsRow}>
              {renderWheel({
                values: HOURS,
                draftValue: draftHour,
                paddedData: paddedHours,
                listRef: hoursRef,
                onSnap: snapHour,
                width: 72,
              })}
              <AppText style={[styles.colon, { color: colors.textMuted }]}>:</AppText>
              {renderWheel({
                values: MINUTES,
                draftValue: draftMinute,
                paddedData: paddedMinutes,
                listRef: minutesRef,
                onSnap: snapMinute,
                width: 72,
              })}
              <View style={styles.minuteToPeriodGap} />
              {renderWheel({
                values: PERIODS,
                draftValue: draftPeriod,
                paddedData: paddedPeriods,
                listRef: periodsRef,
                onSnap: snapPeriod,
                width: 84,
              })}
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={applySelection} style={styles.cta}>
              <AppText style={styles.ctaText}>Set time</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  minuteToPeriodGap: { width: 10 },
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
