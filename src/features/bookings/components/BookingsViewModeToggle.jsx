import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { BOOKINGS_VIEW_LIST, BOOKINGS_VIEW_PLANNER } from '../constants';

const TRACK_PAD = 6;
const SEGMENT_GAP = 4;
const SEGMENT_WIDTH = 112;
const SEGMENT_HEIGHT = 38;
const TRACK_HEIGHT = TRACK_PAD * 2 + SEGMENT_HEIGHT;
const SEGMENT_INSET_H = 12;
const SEGMENT_RADIUS = SEGMENT_HEIGHT / 2;
const TRACK_RADIUS = TRACK_HEIGHT / 2;

const ACTIVE_FG = '#000000';
const ACTIVE_BG = '#ffffff';

/**
 * Compact rounded segmented toggle: List (left) · Day (right). Selected segment uses a white pill.
 *
 * @param {{
 *   mode: import('../constants').BookingsViewMode;
 *   onChange: (mode: import('../constants').BookingsViewMode) => void;
 * }} props
 */
export function BookingsViewModeToggle({ mode, onChange }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.42)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          borderRadius: TRACK_RADIUS,
          borderWidth: StyleSheet.hairlineWidth,
          elevation: 12,
          flexDirection: 'row',
          gap: SEGMENT_GAP,
          height: TRACK_HEIGHT,
          overflow: 'hidden',
          padding: TRACK_PAD,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isDark ? 0.38 : 0.11,
          shadowRadius: 11,
        },
        segmentHit: {
          height: SEGMENT_HEIGHT,
          width: SEGMENT_WIDTH,
        },
        /** Explicit px size only — avoid % heights inside Pressable (they can inflate in overlays). */
        segmentSurface: {
          alignItems: 'center',
          borderRadius: SEGMENT_RADIUS,
          height: SEGMENT_HEIGHT,
          justifyContent: 'center',
          paddingHorizontal: SEGMENT_INSET_H,
          width: SEGMENT_WIDTH,
        },
        segmentSurfaceActive: {
          backgroundColor: ACTIVE_BG,
          borderColor: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.14)',
          borderWidth: StyleSheet.hairlineWidth,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.22 : 0.14,
              shadowRadius: 3,
            },
            default: { elevation: 4 },
          }),
        },
        segmentRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
          justifyContent: 'center',
        },
        label: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        labelActive: {
          color: ACTIVE_FG,
        },
      }),
    [colors, isDark],
  );

  const listActive = mode === BOOKINGS_VIEW_LIST;
  const plannerActive = mode === BOOKINGS_VIEW_PLANNER;
  const inactiveIconColor = colors.textMuted;

  const rippleList = listActive
    ? 'rgba(0,0,0,0.08)'
    : isDark
      ? 'rgba(255,255,255,0.14)'
      : 'rgba(0,0,0,0.08)';
  const rippleDay = plannerActive
    ? 'rgba(0,0,0,0.08)'
    : isDark
      ? 'rgba(255,255,255,0.14)'
      : 'rgba(0,0,0,0.08)';

  return (
    <View accessibilityRole="tablist" style={styles.track}>
      <Pressable
        accessibilityLabel="List view"
        accessibilityRole="tab"
        accessibilityState={{ selected: listActive }}
        android_ripple={{ color: rippleList, borderless: false }}
        hitSlop={6}
        onPress={() => onChange(BOOKINGS_VIEW_LIST)}
        style={({ pressed }) => [styles.segmentHit, pressed && { opacity: 0.92 }]}
      >
        <View
          style={[
            styles.segmentSurface,
            listActive && styles.segmentSurfaceActive,
          ]}
        >
          <View style={styles.segmentRow}>
            <Ionicons
              color={listActive ? ACTIVE_FG : inactiveIconColor}
              name="list"
              size={18}
            />
            <Text style={[styles.label, listActive && styles.labelActive]}>List</Text>
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Day planner"
        accessibilityRole="tab"
        accessibilityState={{ selected: plannerActive }}
        android_ripple={{ color: rippleDay, borderless: false }}
        hitSlop={6}
        onPress={() => onChange(BOOKINGS_VIEW_PLANNER)}
        style={({ pressed }) => [styles.segmentHit, pressed && { opacity: 0.92 }]}
      >
        <View
          style={[
            styles.segmentSurface,
            plannerActive && styles.segmentSurfaceActive,
          ]}
        >
          <View style={styles.segmentRow}>
            <Ionicons
              color={plannerActive ? ACTIVE_FG : inactiveIconColor}
              name="calendar-outline"
              size={18}
            />
            <Text style={[styles.label, plannerActive && styles.labelActive]}>Day</Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
