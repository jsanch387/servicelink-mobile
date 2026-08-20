import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { Button } from './Button';
import { useBottomSheetOverlay } from './bottomSheetOverlay';
import { SheetCloseButton } from './SheetCloseButton';
import {
  scheduleSheetOpen,
  useModalFadeBackdropSlideSheet,
} from './useModalFadeBackdropSlideSheet';
import { triggerWheelSelectionHaptic } from './wheelHaptics';

export const WHEEL_ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const SPACER_ROWS = 2;

function paddedValues(values) {
  return [...Array(SPACER_ROWS).fill(null), ...values, ...Array(SPACER_ROWS).fill(null)];
}

function getValueIndexFromOffset(offsetY, valuesLength) {
  const rawIndex = Math.round(Math.max(0, offsetY) / WHEEL_ITEM_HEIGHT);
  return Math.min(valuesLength - 1, Math.max(0, rawIndex));
}

/**
 * One snapping wheel column. Values are display strings and `selected` is one of them.
 * `values` may change while open (e.g. switching weeks → months); the column re-snaps.
 */
export function WheelColumn({ values, selected, onSelectedChange, listRef, wheelStyle }) {
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
  const selectedRef = useRef(selected);
  const didMountRef = useRef(false);

  selectedRef.current = selected;

  const highlightedValue = values[highlightIndex] ?? values[0];

  // Re-align when the list itself changes; skipped on mount so the opener controls first paint.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    const idx = Math.max(
      0,
      values.findIndex((v) => v === selectedRef.current),
    );
    highlightIndexRef.current = idx;
    lastHapticIndexRef.current = idx;
    setHighlightIndex(idx);
    listRef.current?.scrollTo({ animated: false, y: idx * WHEEL_ITEM_HEIGHT });
  }, [values, listRef]);

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
      const snappedY = idx * WHEEL_ITEM_HEIGHT;
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
        snapToInterval={WHEEL_ITEM_HEIGHT}
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

/**
 * Bottom panel that hosts wheel columns.
 * Chrome matches {@link BottomSheetModal} (overlay / fitContent) — wheels stay unchanged.
 *
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.confirmTitle
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onRequestClose
 */
export function WheelPickerSheetShell({
  title,
  confirmTitle,
  onConfirm,
  onRequestClose,
  sheetStyle,
  backdropStyle,
  children,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const topRadius = Platform.OS === 'android' ? 28 : 18;

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
            borderTopLeftRadius: topRadius,
            borderTopRightRadius: topRadius,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            paddingHorizontal: 16,
            paddingTop: 16,
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <AppText style={[styles.sheetTitle, { color: colors.text }]}>{title}</AppText>
            <SheetCloseButton onPress={onRequestClose} />
          </View>
          <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />
        </View>

        {children}

        <View style={styles.footer}>
          <Button fullWidth title={confirmTitle} variant="primary" onPress={onConfirm} />
        </View>
      </Animated.View>
    </>
  );
}

function WheelPickerOverlay({ render, onClose }) {
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const close = useCallback(() => {
    runClose(onClose);
  }, [runClose, onClose]);

  useEffect(() => {
    prepareOpen();
    return scheduleSheetOpen(runOpen);
  }, [prepareOpen, runOpen]);

  return <View style={styles.overlayRoot}>{render({ backdropStyle, close, sheetStyle })}</View>;
}

/**
 * Opens a wheel sheet from anywhere, including from inside another sheet: uses the parent
 * sheet's inline overlay when there is one, otherwise its own modal.
 *
 * The overlay path renders `render` once at press time, so the sheet must hold its own
 * draft state and report the result through a callback.
 *
 * @param {(args: { backdropStyle: unknown; sheetStyle: unknown; close: () => void }) => React.ReactNode} render
 * @returns {{ present: () => void; host: React.ReactNode }}
 */
export function useWheelPickerSheet(render) {
  const overlay = useBottomSheetOverlay();
  const [open, setOpen] = useState(false);
  const { prepareOpen, runOpen, runClose, backdropStyle, sheetStyle } =
    useModalFadeBackdropSlideSheet();

  const close = useCallback(() => {
    runClose(() => setOpen(false));
  }, [runClose]);

  useEffect(() => {
    if (!open) return undefined;
    return scheduleSheetOpen(runOpen);
  }, [open, runOpen]);

  useEffect(() => () => overlay?.hide(), [overlay]);

  const present = useCallback(() => {
    Keyboard.dismiss();
    if (overlay) {
      overlay.show(<WheelPickerOverlay render={render} onClose={() => overlay.hide()} />);
      return;
    }
    prepareOpen();
    setOpen(true);
  }, [overlay, prepareOpen, render]);

  const host = overlay ? null : (
    <Modal
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={open}
    >
      <View style={styles.modalRoot}>
        {open ? render({ backdropStyle, close, sheetStyle }) : null}
      </View>
    </Modal>
  );

  return { host, present };
}

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropFill: {
    backgroundColor: 'rgba(0,0,0,0.76)',
  },
  sheetWrap: {
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
  },
  header: {
    paddingBottom: 0,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 0,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  footer: {
    marginTop: 8,
  },
  wheelContainer: {
    height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS,
    justifyContent: 'center',
    width: 84,
  },
  wheelList: {
    flexGrow: 0,
  },
  wheelHighlight: {
    borderRadius: 10,
    height: WHEEL_ITEM_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: WHEEL_ITEM_HEIGHT * SPACER_ROWS,
  },
  dialItem: { alignItems: 'center', height: WHEEL_ITEM_HEIGHT, justifyContent: 'center' },
  dialItemText: { fontSize: 18, fontWeight: '500' },
});
