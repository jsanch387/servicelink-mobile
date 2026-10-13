import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { useTheme } from '../../theme';
import { AppText } from './AppText';
import { triggerWheelSelectionHaptic } from './wheelHaptics';

export const WHEEL_ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const SPACER_ROWS = 2;
const WheelScroller = Platform.OS === 'android' ? GestureScrollView : ScrollView;

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
export function WheelColumn({
  values,
  selected,
  onSelectedChange,
  listRef,
  wheelStyle,
  fullWidth = false,
  itemTextStyle,
}) {
  const { colors } = useTheme();
  const padded = useMemo(() => paddedValues(values), [values]);
  const initialIndex = Math.max(
    0,
    values.findIndex((v) => v === selected),
  );
  const lastHapticIndexRef = useRef(initialIndex);
  const isSnappingRef = useRef(false);
  const selectedRef = useRef(selected);
  const didMountRef = useRef(false);
  const didPositionRef = useRef(false);
  const offsetRef = useRef(initialIndex * WHEEL_ITEM_HEIGHT);

  selectedRef.current = selected;

  const rows = useMemo(
    () =>
      padded.map((item, index) => (
        <View
          key={`${item ?? 'spacer'}-${index}`}
          style={[styles.dialItem, fullWidth && styles.dialItemFull]}
        >
          <AppText
            numberOfLines={fullWidth ? 1 : undefined}
            style={[styles.dialItemText, { color: colors.text }, itemTextStyle]}
          >
            {item ?? ''}
          </AppText>
        </View>
      )),
    [padded, fullWidth, colors.text, itemTextStyle],
  );

  const scrollToIndex = useCallback(
    (idx) => {
      const y = idx * WHEEL_ITEM_HEIGHT;
      offsetRef.current = y;
      listRef.current?.scrollTo({ animated: false, y });
    },
    [listRef],
  );

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
    lastHapticIndexRef.current = idx;
    scrollToIndex(idx);
  }, [values, scrollToIndex]);

  const noteOffset = useCallback(
    (offsetY) => {
      offsetRef.current = offsetY;
      const idx = getValueIndexFromOffset(offsetY, values.length);
      if (lastHapticIndexRef.current === idx) return;
      lastHapticIndexRef.current = idx;
      triggerWheelSelectionHaptic();
    },
    [values.length],
  );

  const commitIndex = useCallback(
    (idx) => {
      const clamped = Math.min(values.length - 1, Math.max(0, idx));
      lastHapticIndexRef.current = clamped;
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
        scrollToIndex(idx);
        requestAnimationFrame(() => {
          isSnappingRef.current = false;
        });
      }
    },
    [values.length, commitIndex, scrollToIndex],
  );

  const positionOnce = useCallback(() => {
    if (didPositionRef.current) return;
    didPositionRef.current = true;
    const idx = Math.max(
      0,
      values.findIndex((v) => v === selectedRef.current),
    );
    lastHapticIndexRef.current = idx;
    scrollToIndex(idx);
  }, [scrollToIndex, values]);

  return (
    <View collapsable={false} style={[styles.wheelContainer, wheelStyle]}>
      <View
        pointerEvents="none"
        style={[styles.wheelHighlight, { backgroundColor: colors.buttonGhostPressed }]}
      />
      <WheelScroller
        ref={listRef}
        contentContainerStyle={styles.wheelContent}
        decelerationRate="fast"
        nestedScrollEnabled
        overScrollMode="never"
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={WHEEL_ITEM_HEIGHT}
        style={styles.wheelList}
        onContentSizeChange={positionOnce}
        onMomentumScrollEnd={(e) => snapToOffset(e.nativeEvent.contentOffset.y)}
        onScroll={(e) => {
          if (isSnappingRef.current) return;
          noteOffset(e.nativeEvent.contentOffset.y);
        }}
        onScrollEndDrag={(e) => {
          const velocityY = e.nativeEvent.velocity?.y ?? 0;
          if (Math.abs(velocityY) > 0.05) return;
          snapToOffset(e.nativeEvent.contentOffset.y);
        }}
      >
        {rows}
      </WheelScroller>
    </View>
  );
}

const styles = StyleSheet.create({
  wheelContainer: {
    height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS,
    justifyContent: 'center',
    width: 84,
  },
  // Explicit height: Android lays out an unbounded ScrollView at content size, so the wheel cannot move.
  wheelList: {
    flexGrow: 0,
    height: WHEEL_ITEM_HEIGHT * VISIBLE_ROWS,
  },
  wheelContent: {
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
  dialItemFull: {
    alignSelf: 'stretch',
    paddingHorizontal: 16,
    width: '100%',
  },
  dialItemText: { fontSize: 18, fontWeight: '500' },
});
