import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

const ACTION_WIDTH = 88;

/**
 * Swipe left to reveal Remove; opening the swipe prompts confirm (Remove / Cancel).
 * The row stays open while the confirm alert is visible.
 *
 * @param {{
 *   enabled?: boolean;
 *   onDeletePress: (helpers: { close: () => void }) => void;
 *   children: import('react').ReactNode;
 *   accessibilityLabel?: string;
 * }} props
 */
export function SwipeToDeleteRow({
  enabled = true,
  onDeletePress,
  children,
  accessibilityLabel = 'Remove',
}) {
  const { colors } = useTheme();
  const removeColor = colors.danger ?? '#f87171';
  const [rowHeight, setRowHeight] = useState(0);
  const swipeableRef = useRef(null);
  const confirmLockRef = useRef(false);

  const fireHaptic = useCallback((style) => {
    void Haptics.impactAsync(style).catch(() => {});
  }, []);

  const close = useCallback(() => {
    swipeableRef.current?.close();
  }, []);

  const triggerConfirm = useCallback(() => {
    if (confirmLockRef.current) return;
    confirmLockRef.current = true;
    fireHaptic(Haptics.ImpactFeedbackStyle.Medium);
    onDeletePress({ close });
  }, [close, fireHaptic, onDeletePress]);

  const renderRightActions = useCallback(
    () => (
      <View
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        style={[
          styles.actionSlot,
          rowHeight > 0 ? { height: rowHeight } : styles.actionSlotFallback,
        ]}
      >
        <Ionicons color={removeColor} name="trash-outline" size={22} />
        <AppText style={[styles.removeLabel, { color: removeColor }]}>Remove</AppText>
      </View>
    ),
    [accessibilityLabel, removeColor, rowHeight],
  );

  if (!enabled) {
    return children;
  }

  return (
    <View
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.height);
        if (next > 0 && next !== rowHeight) setRowHeight(next);
      }}
    >
      <Swipeable
        ref={swipeableRef}
        friction={1}
        overshootRight={false}
        renderRightActions={renderRightActions}
        rightThreshold={40}
        onSwipeableClose={() => {
          confirmLockRef.current = false;
        }}
        onSwipeableOpen={() => {
          triggerConfirm();
        }}
        onSwipeableOpenStartDrag={() => {
          fireHaptic(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        {children}
      </Swipeable>
    </View>
  );
}

const styles = StyleSheet.create({
  actionSlot: {
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
    width: ACTION_WIDTH,
  },
  actionSlotFallback: {
    alignSelf: 'stretch',
  },
  removeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
