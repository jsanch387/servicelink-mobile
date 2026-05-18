import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { triggerWheelSelectionHaptic } from './wheelHaptics';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { useBottomSheetOverlay } from './bottomSheetOverlay';
import { useModalFadeBackdropSlideSheet } from './useModalFadeBackdropSlideSheet';
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

function WheelColumn({ values, selected, onSelectedChange, listRef, wheelStyle }) {
  const { colors } = useTheme();
  const padded = useMemo(() => paddedValues(values), [values]);
  const initialIndex = Math.max(
    0,
    values.findIndex((v) => v === selected),
  );
  const [highlightIndex, setHighlightIndex] = useState(initialIndex);
  const highlightIndexRef = useRef(initialIndex);
  const lastHapticIndexRef = useRef(initialIndex);
  const isSnappingRef = useRef(false);

  const highlightedValue = values[highlightIndex] ?? values[0];

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

  const commitIndex = useCallback(
    (idx) => {
      const clamped = Math.min(values.length - 1, Math.max(0, idx));
      highlightIndexRef.current = clamped;
      lastHapticIndexRef.current = clamped;
      setHighlightIndex(clamped);
      onSelectedChange(values[clamped]);
    },
    [values, onSelectedChange],
  );

  const snapToOffset = useCallback(
    (offsetY) => {
      if (isSnappingRef.current) return;
      const idx = getValueIndexFromOffset(offsetY, values.length);
      const snappedY = idx * ITEM_HEIGHT;
      commitIndex(idx);
      if (Math.abs(offsetY - snappedY) > 0.5) {
        isSnappingRef.current = true;
        listRef.current?.scrollTo({ animated: false, y: snappedY });
        requestAnimationFrame(() => {
          isSnappingRef.current = false;
        });
      }
    },
    [values.length, commitIndex, listRef],
  );

  return (
    <View style={[styles.wheelContainer, wheelStyle]}>
      <View
        pointerEvents="none"
        style={[styles.wheelHighlight, { backgroundColor: colors.buttonGhostPressed }]}
      />
      <ScrollView
        ref={listRef}
        decelerationRate="fast"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        style={styles.wheelList}
        onMomentumScrollEnd={(e) => snapToOffset(e.nativeEvent.contentOffset.y)}
        onScroll={(e) => {
          if (isSnappingRef.current) return;
          previewIndexFromOffset(e.nativeEvent.contentOffset.y);
        }}
        onScrollEndDrag={(e) => {
          const velocityY = e.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(velocityY) > 0.05) return;
          snapToOffset(e.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={32}
      >
        {padded.map((item, index) => (
          <View key={`${item ?? 'spacer'}-${index}`} style={styles.dialItem}>
            <AppText
              style={[
                styles.dialItemText,
                { color: item === highlightedValue ? colors.text : colors.textMuted },
              ]}
            >
              {item ?? ''}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
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
  const insets = useSafeAreaInsets();
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
      hoursRef.current?.scrollTo({ animated: false, y: hourIndex * ITEM_HEIGHT });
      minutesRef.current?.scrollTo({ animated: false, y: minuteIndex * ITEM_HEIGHT });
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(applyScroll);
    });
  }, [initialHour, initialMinute]);

  function applySelection() {
    let total = (parseInt(draftHour, 10) || 0) * 60 + (draftMinute === '30' ? 30 : 0);
    if (mode === 'addon') {
      if (total <= 0) {
        onConfirm('');
        return;
      }
      total = Math.max(SERVICE_DURATION_MIN_MINUTES, Math.min(SERVICE_DURATION_MAX_MINUTES, total));
      const h = Math.floor(total / 60);
      const m = total % 60;
      onConfirm(`${String(h).padStart(2, '0')}:${m === 30 ? '30' : '00'}`);
      return;
    }
    total = Math.max(SERVICE_DURATION_MIN_MINUTES, Math.min(SERVICE_DURATION_MAX_MINUTES, total));
    const h = Math.floor(total / 60);
    const m = total % 60;
    onConfirm(`${String(h).padStart(2, '0')}:${m === 30 ? '30' : '00'}`);
  }

  return (
    <>
      <Animated.View
        pointerEvents="box-none"
        style={[StyleSheet.absoluteFillObject, backdropStyle, styles.backdropFill]}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onRequestClose}
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
            <AppText style={[styles.sheetTitle, { color: colors.textMuted }]}>
              Select duration
            </AppText>
            <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={onRequestClose}>
              <Ionicons color={colors.textMuted} name="close" size={20} />
            </TouchableOpacity>
          </View>

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

          <TouchableOpacity activeOpacity={0.9} onPress={applySelection} style={styles.cta}>
            <AppText style={styles.ctaText}>Set duration</AppText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

function DurationPickerOverlay({ mode, initialHour, initialMinute, onClose, onConfirm }) {
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const close = useCallback(() => {
    runClose(onClose);
  }, [runClose, onClose]);

  useEffect(() => {
    prepareOpen();
    const id = requestAnimationFrame(() => runOpen());
    return () => cancelAnimationFrame(id);
  }, [prepareOpen, runOpen]);

  return (
    <View style={styles.overlayRoot}>
      <DurationPickerSheet
        backdropStyle={backdropStyle}
        initialHour={initialHour}
        initialMinute={initialMinute}
        mode={mode}
        sheetStyle={sheetStyle}
        onConfirm={(next) => {
          onConfirm(next);
          close();
        }}
        onRequestClose={close}
      />
    </View>
  );
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
  const bottomSheetOverlay = useBottomSheetOverlay();
  const [open, setOpen] = useState(false);
  const [pickerInitial, setPickerInitial] = useState({ hour: '1', minute: '00' });
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

  useEffect(() => () => bottomSheetOverlay?.hide(), [bottomSheetOverlay]);

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
    const { hour, minute } = resolveDraftFromValue(value, mode);
    setPickerInitial({ hour, minute });
    if (bottomSheetOverlay) {
      bottomSheetOverlay.show(
        <DurationPickerOverlay
          initialHour={hour}
          initialMinute={minute}
          mode={mode}
          onClose={() => bottomSheetOverlay.hide()}
          onConfirm={onValueChange}
        />,
      );
      return;
    }
    prepareOpen();
    setOpen(true);
  }

  return (
    <View style={[styles.field, containerStyle]}>
      {label ? (
        typeof label === 'string' ? (
          <AppText style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</AppText>
        ) : (
          <View style={styles.fieldLabelNodeWrap}>{label}</View>
        )
      ) : null}

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

      {!bottomSheetOverlay ? (
        <Modal
          animationType="none"
          onRequestClose={close}
          statusBarTranslucent
          transparent
          visible={open}
        >
          <View style={styles.modalRoot}>
            {open ? (
              <DurationPickerSheet
                backdropStyle={backdropStyle}
                initialHour={pickerInitial.hour}
                initialMinute={pickerInitial.minute}
                mode={mode}
                sheetStyle={sheetStyle}
                onConfirm={(next) => {
                  onValueChange(next);
                  close();
                }}
                onRequestClose={close}
              />
            ) : null}
          </View>
        </Modal>
      ) : null}
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
    fontSize: 15,
    fontWeight: '500',
    minHeight: 34,
    paddingLeft: 6,
    paddingRight: 10,
    paddingVertical: 8,
  },
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
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
