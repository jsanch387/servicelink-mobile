import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { BOOKINGS_CALENDAR_GRANULARITY_OPTIONS, BOOKINGS_LIST_SCREEN_PADDING } from '../constants';

const TRACK_PAD = 3;
const SEGMENT_HEIGHT = 30;
const TRACK_HEIGHT = TRACK_PAD * 2 + SEGMENT_HEIGHT;
const SEGMENT_RADIUS = SEGMENT_HEIGHT / 2;

const ACTIVE_FG = '#000000';
const ACTIVE_BG = '#ffffff';

/** Day · Week · Month — compact version of the translucent list/calendar toggle. */
export function BookingsCalendarGranularityTabs({ value, onChange }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          paddingBottom: 8,
          paddingHorizontal: BOOKINGS_LIST_SCREEN_PADDING,
          paddingTop: 8,
        },
        track: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.42)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          borderRadius: TRACK_HEIGHT / 2,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          height: TRACK_HEIGHT,
          padding: TRACK_PAD,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDark ? 0.28 : 0.08,
              shadowRadius: 8,
            },
          }),
        },
        segmentSlot: {
          alignItems: 'center',
          flex: 1,
          height: SEGMENT_HEIGHT,
          justifyContent: 'center',
        },
        selectedFill: {
          backgroundColor: ACTIVE_BG,
          borderRadius: SEGMENT_RADIUS,
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        },
        segment: {
          alignItems: 'center',
          height: SEGMENT_HEIGHT,
          justifyContent: 'center',
          paddingHorizontal: 8,
        },
        label: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.15,
        },
        labelOn: {
          color: ACTIVE_FG,
        },
      }),
    [colors, isDark],
  );

  return (
    <View accessibilityRole="tablist" style={styles.wrap}>
      <View style={styles.track}>
        {BOOKINGS_CALENDAR_GRANULARITY_OPTIONS.map((opt) => {
          const selected = opt.id === value;
          return (
            <View key={opt.id} style={styles.segmentSlot}>
              {selected ? <View pointerEvents="none" style={styles.selectedFill} /> : null}
              <Pressable
                accessibilityLabel={`${opt.label} calendar view`}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                android_ripple={{ color: 'transparent' }}
                onPress={() => onChange(opt.id)}
              >
                {({ pressed }) => (
                  <View style={[styles.segment, pressed && { opacity: 0.88 }]}>
                    <AppText numberOfLines={1} style={[styles.label, selected && styles.labelOn]}>
                      {opt.label}
                    </AppText>
                  </View>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
