import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { useModalFadeBackdropSlideSheet } from './useModalFadeBackdropSlideSheet';
import { triggerWheelSelectionHaptic } from './wheelHaptics';

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

function TimeWheelColumn({ values, selected, onSelectedChange, listRef, width }) {
  const { colors } = useTheme();
  const paddedData = useMemo(() => paddedValues(values), [values]);
  const initialIndex = Math.max(
    0,
    values.findIndex((v) => v === selected),
  );
  const [highlightIndex, setHighlightIndex] = useState(initialIndex);
  const highlightIndexRef = useRef(initialIndex);
  const lastHapticIndexRef = useRef(initialIndex);

  const highlightedValue = values[highlightIndex] ?? values[0];

  useEffect(() => {
    const idx = Math.max(
      0,
      values.findIndex((v) => v === selected),
    );
    highlightIndexRef.current = idx;
    lastHapticIndexRef.current = idx;
    setHighlightIndex(idx);
  }, [selected, values]);

  const previewIndexFromOffset = useCallback(
    (offsetY) => {
      const idx = getValueIndexFromOffset(offsetY, values.length);
      if (highlightIndexRef.current === idx) return;
      highlightIndexRef.current = idx;
      setHighlightIndex(idx);
      if (lastHapticIndexRef.current !== idx) {
        lastHapticIndexRef.current = idx;
        triggerWheelSelectionHaptic();
      }
    },
    [values.length],
  );

  const snapToOffset = useCallback(
    (offsetY) => {
      const idx = getValueIndexFromOffset(offsetY, values.length);
      highlightIndexRef.current = idx;
      lastHapticIndexRef.current = idx;
      setHighlightIndex(idx);
      onSelectedChange(values[idx]);
    },
    [values, onSelectedChange],
  );

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
                { color: item === highlightedValue ? colors.text : colors.textMuted },
              ]}
            >
              {item ?? ''}
            </AppText>
          </View>
        )}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        onMomentumScrollEnd={(e) => snapToOffset(e.nativeEvent.contentOffset.y)}
        onScroll={(e) => previewIndexFromOffset(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => {
          const velocityY = e.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(velocityY) > 0.05) return;
          snapToOffset(e.nativeEvent.contentOffset.y);
        }}
        style={styles.wheelList}
      />
    </View>
  );
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
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const close = useCallback(() => {
    runClose(() => setOpen(false));
  }, [runClose]);

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [open, runOpen]);

  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const periodsRef = useRef(null);

  const [draftHour, setDraftHour] = useState('9');
  const [draftMinute, setDraftMinute] = useState('00');
  const [draftPeriod, setDraftPeriod] = useState('AM');

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
    prepareOpen();
    setOpen(true);
  }

  function applySelection() {
    onValueChange(formatTime(draftHour, draftMinute, draftPeriod));
    runClose(() => setOpen(false));
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

      <Modal animationType="none" onRequestClose={close} transparent visible={open}>
        <View style={styles.modalRoot}>
          <Animated.View
            pointerEvents="box-none"
            style={[StyleSheet.absoluteFillObject, backdropStyle, styles.backdropFill]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={close}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.sheetWrap,
              sheetStyle,
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
                <TouchableOpacity hitSlop={8} onPress={close}>
                  <Ionicons color={colors.textMuted} name="close" size={20} />
                </TouchableOpacity>
              </View>

              <View style={styles.dialsRow}>
                <TimeWheelColumn
                  listRef={hoursRef}
                  selected={draftHour}
                  values={HOURS}
                  width={72}
                  onSelectedChange={setDraftHour}
                />
                <AppText style={[styles.colon, { color: colors.textMuted }]}>:</AppText>
                <TimeWheelColumn
                  listRef={minutesRef}
                  selected={draftMinute}
                  values={MINUTES}
                  width={72}
                  onSelectedChange={setDraftMinute}
                />
                <View style={styles.minuteToPeriodGap} />
                <TimeWheelColumn
                  listRef={periodsRef}
                  selected={draftPeriod}
                  values={PERIODS}
                  width={84}
                  onSelectedChange={setDraftPeriod}
                />
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={applySelection} style={styles.cta}>
                <AppText style={styles.ctaText}>Set time</AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
  modalRoot: {
    flex: 1,
  },
  backdropFill: {
    backgroundColor: 'rgba(0,0,0,0.60)',
  },
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
