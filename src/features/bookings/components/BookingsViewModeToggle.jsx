import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { BOOKINGS_VIEW_CALENDAR, BOOKINGS_VIEW_LIST } from '../constants';

const TRACK_PAD = 6;
const SEGMENT_GAP = 4;
const SEGMENT_WIDTH = 120;
const SEGMENT_HEIGHT = 38;
const TRACK_HEIGHT = TRACK_PAD * 2 + SEGMENT_HEIGHT;
const SEGMENT_INSET_H = 12;
const SEGMENT_RADIUS = SEGMENT_HEIGHT / 2;
const TRACK_RADIUS = TRACK_HEIGHT / 2;

const ACTIVE_FG = '#000000';
const ACTIVE_BG = '#ffffff';

/**
 * Compact rounded segmented toggle: List (left) · Calendar (right). Selected segment uses a white pill.
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
  const calendarActive = mode === BOOKINGS_VIEW_CALENDAR;
  const inactiveIconColor = colors.textMuted;

  const rippleList = listActive
    ? 'rgba(0,0,0,0.08)'
    : isDark
      ? 'rgba(255,255,255,0.14)'
      : 'rgba(0,0,0,0.08)';
  const rippleCalendar = calendarActive
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
        <View style={[styles.segmentSurface, listActive && styles.segmentSurfaceActive]}>
          <View style={styles.segmentRow}>
            <Ionicons color={listActive ? ACTIVE_FG : inactiveIconColor} name="list" size={18} />
            <AppText style={[styles.label, listActive && styles.labelActive]}>List</AppText>
          </View>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel="Calendar view"
        accessibilityRole="tab"
        accessibilityState={{ selected: calendarActive }}
        android_ripple={{ color: rippleCalendar, borderless: false }}
        hitSlop={6}
        onPress={() => onChange(BOOKINGS_VIEW_CALENDAR)}
        style={({ pressed }) => [styles.segmentHit, pressed && { opacity: 0.92 }]}
      >
        <View style={[styles.segmentSurface, calendarActive && styles.segmentSurfaceActive]}>
          <View style={styles.segmentRow}>
            <Ionicons
              color={calendarActive ? ACTIVE_FG : inactiveIconColor}
              name="calendar-outline"
              size={18}
            />
            <AppText style={[styles.label, calendarActive && styles.labelActive]}>Calendar</AppText>
          </View>
        </View>
      </Pressable>
    </View>
  );
}
