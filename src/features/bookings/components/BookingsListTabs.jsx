import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { BOOKINGS_FILTER_OPTIONS, BOOKINGS_LIST_SCREEN_PADDING } from '../constants';

const INDICATOR_HEIGHT = 3;

/** Upcoming → Past → Cancelled, left-aligned; indicator matches text width. */
export function BookingsListTabs({ value, onChange }) {
  const { colors } = useTheme();
  const [measures, setMeasures] = useState({});

  const setPressableX = useCallback((id, x) => {
    setMeasures((prev) => ({
      ...prev,
      [id]: { ...prev[id], px: x },
    }));
  }, []);

  const setTextLayout = useCallback((id, x, width) => {
    setMeasures((prev) => ({
      ...prev,
      [id]: { ...prev[id], tx: x, tw: width },
    }));
  }, []);

  const activeMeasure = measures[value];
  const hasIndicator =
    activeMeasure &&
    activeMeasure.tw != null &&
    activeMeasure.tw > 0 &&
    activeMeasure.px !== undefined &&
    activeMeasure.tx !== undefined;
  const indicatorLeft = hasIndicator ? activeMeasure.px + activeMeasure.tx : 0;
  const indicatorWidth = hasIndicator ? activeMeasure.tw : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING,
          paddingTop: 6,
        },
        tabRow: {
          flexDirection: 'row',
          gap: 22,
          justifyContent: 'flex-start',
          width: '100%',
        },
        tab: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingBottom: 12,
          paddingHorizontal: 10,
          paddingTop: 10,
        },
        tabLeading: {
          paddingLeft: 0,
        },
        tabLabel: {
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        tabLabelActive: {
          color: colors.tabBarActive,
          fontWeight: '700',
        },
        tabLabelIdle: {
          color: colors.textMuted,
        },
        indicatorTrack: {
          backgroundColor: 'transparent',
          height: INDICATOR_HEIGHT,
          marginTop: 10,
          width: '100%',
        },
        indicator: {
          backgroundColor: colors.tabBarActive,
          height: INDICATOR_HEIGHT,
          position: 'absolute',
          top: 0,
        },
        divider: {
          backgroundColor: colors.border,
          height: StyleSheet.hairlineWidth,
          width: '100%',
        },
      }),
    [colors],
  );

  return (
    <View accessibilityRole="tablist" style={styles.wrap}>
      <View style={styles.tabRow}>
        {BOOKINGS_FILTER_OPTIONS.map((opt, index) => {
          const selected = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              accessibilityLabel={`${opt.label} appointments`}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              hitSlop={{ top: 8, bottom: 8 }}
              onLayout={(e) => setPressableX(opt.id, e.nativeEvent.layout.x)}
              onPress={() => onChange(opt.id)}
              style={({ pressed }) => [
                styles.tab,
                index === 0 && styles.tabLeading,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text
                numberOfLines={1}
                onLayout={(e) => {
                  const { x, width } = e.nativeEvent.layout;
                  setTextLayout(opt.id, x, width);
                }}
                style={[styles.tabLabel, selected ? styles.tabLabelActive : styles.tabLabelIdle]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.indicatorTrack}>
        {hasIndicator ? (
          <View
            style={[
              styles.indicator,
              {
                left: indicatorLeft,
                width: indicatorWidth,
              },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.divider} />
    </View>
  );
}
