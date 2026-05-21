import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

export const MAX_APPOINTMENT_MARKER_DOTS = 4;

/**
 * @param {number} count
 * @returns {{ dotCount: number; showPlus: boolean }}
 */
/**
 * Subtle cell fill strength for owner booking calendars (0–1).
 *
 * @param {number} count
 */
export function appointmentDayFillOpacity(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n === 0) return 0;
  if (n >= 5) return 0.24;
  if (n === 4) return 0.2;
  if (n === 3) return 0.15;
  if (n === 2) return 0.1;
  return 0.06;
}

export function resolveAppointmentMarkerLayout(count) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n === 0) {
    return { dotCount: 0, showPlus: false };
  }
  if (n > MAX_APPOINTMENT_MARKER_DOTS) {
    return { dotCount: MAX_APPOINTMENT_MARKER_DOTS, showPlus: true };
  }
  return { dotCount: n, showPlus: false };
}

/**
 * Up to four accent dots for appointment count; `+` when count exceeds four.
 *
 * @param {{
 *   count: number;
 *   compact?: boolean;
 *   inverted?: boolean;
 * }} props
 */
export function AppointmentCountMarkers({ count, compact = false, inverted = false }) {
  const { colors } = useTheme();
  const { dotCount, showPlus } = useMemo(() => resolveAppointmentMarkerLayout(count), [count]);
  const markerColor = inverted ? colors.buttonPrimaryText : colors.accent;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: compact ? 2 : 3,
          justifyContent: 'center',
        },
        dot: {
          backgroundColor: markerColor,
          borderRadius: compact ? 2 : 2.5,
          height: compact ? 4 : 5,
          width: compact ? 4 : 5,
        },
        plus: {
          color: markerColor,
          fontSize: compact ? 8 : 9,
          fontWeight: '800',
          lineHeight: compact ? 9 : 10,
          marginLeft: showPlus && dotCount > 0 ? 1 : 0,
        },
      }),
    [markerColor, compact, showPlus, dotCount],
  );

  if (dotCount === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: dotCount }, (_, i) => (
        <View key={i} style={styles.dot} />
      ))}
      {showPlus ? <AppText style={styles.plus}>+</AppText> : null}
    </View>
  );
}
