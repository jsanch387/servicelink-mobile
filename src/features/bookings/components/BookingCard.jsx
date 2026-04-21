import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { parseBookingStartLocalMs } from '../../home/utils/bookingStart';

/**
 * Summary row for a booking (details screen later).
 *
 * @param {{
 *   booking: object;
 *   variant?: 'standalone' | 'underDateHeader';
 *   showRelativeLine?: boolean;
 * }} props
 */
export function BookingCard({
  booking,
  variant = 'standalone',
  showRelativeLine = true,
}) {
  const { colors } = useTheme();
  const serviceTitle = booking.service_name?.trim() || 'Detail package';
  const customerName = booking.customer_name?.trim() || 'Customer';
  const scheduleMs = useMemo(
    () => parseBookingStartLocalMs(booking.scheduled_date, booking.start_time),
    [booking.scheduled_date, booking.start_time],
  );
  const timeParts = useMemo(() => {
    if (!Number.isFinite(scheduleMs)) {
      return { time: '—', meridiem: '', date: '' };
    }
    const d = new Date(scheduleMs);
    const full = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
    const match = full.match(/^(.*?)[\s\u202f\u00a0]*(AM|PM)$/i);
    const time = match?.[1]?.trim() ?? full;
    const meridiem = (match?.[2] ?? '').toUpperCase();
    return {
      time: time ?? '—',
      meridiem,
      date:
        variant === 'underDateHeader'
          ? ''
          : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  }, [scheduleMs, variant]);
  const vehicleLine = useMemo(() => {
    const parts = [
      booking.customer_vehicle_year,
      booking.customer_vehicle_make?.trim(),
      booking.customer_vehicle_model?.trim(),
      booking.vehicle_year,
      booking.vehicle_make?.trim(),
      booking.vehicle_model?.trim(),
      booking.vehicle_color?.trim(),
    ].filter(Boolean);
    if (parts.length > 0) {
      return parts.join(' ');
    }
    const singleFieldVehicle =
      booking.vehicle?.trim() ||
      booking.vehicle_name?.trim() ||
      booking.car?.trim() ||
      booking.car_name?.trim();
    return singleFieldVehicle || '';
  }, [
    booking.car,
    booking.car_name,
    booking.customer_vehicle_make,
    booking.customer_vehicle_model,
    booking.customer_vehicle_year,
    booking.vehicle,
    booking.vehicle_color,
    booking.vehicle_make,
    booking.vehicle_model,
    booking.vehicle_name,
    booking.vehicle_year,
  ]);
  const secondaryLine = vehicleLine || 'Vehicle not provided';
  const secondaryIcon = 'car-sport-outline';
  const statusLabel = useMemo(() => {
    const raw = String(booking.status ?? 'confirmed').toLowerCase();
    if (raw === 'cancelled' || raw === 'canceled') {
      return 'Cancelled';
    }
    if (raw === 'completed' || raw === 'complete') {
      return 'Completed';
    }
    return 'Confirmed';
  }, [booking.status]);
  const statusStyle = useMemo(() => {
    if (statusLabel === 'Cancelled') {
      return {
        bg: 'rgba(248,113,113,0.16)',
        text: '#f87171',
        icon: '#f87171',
        iconName: 'close-circle',
      };
    }
    if (statusLabel === 'Completed') {
      return {
        bg: 'rgba(125,211,252,0.16)',
        text: '#7dd3fc',
        icon: '#7dd3fc',
        iconName: 'checkmark-done-circle',
      };
    }
    return {
      bg: 'rgba(16,185,129,0.16)',
      text: '#10b981',
      icon: '#10b981',
      iconName: 'checkmark-circle',
    };
  }, [statusLabel]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        row: {
          alignItems: 'stretch',
          flexDirection: 'row',
        },
        timeCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 56,
        },
        timeText: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.1,
          lineHeight: 19,
          textAlign: 'center',
        },
        meridiem: {
          color: colors.textSecondary,
          fontSize: 11,
          fontWeight: '500',
          lineHeight: 14,
          marginTop: 1,
          textAlign: 'center',
        },
        date: {
          color: colors.textSecondary,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 5,
          textAlign: 'center',
        },
        divider: {
          backgroundColor: colors.borderStrong,
          borderRadius: 999,
          marginLeft: 2,
          marginRight: 10,
          width: 1,
        },
        mainCol: {
          flex: 1,
          minWidth: 0,
        },
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 26,
        },
        customerName: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginRight: 10,
          minWidth: 0,
        },
        statusPill: {
          alignItems: 'center',
          borderRadius: 999,
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        statusText: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.15,
        },
        detailRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: 6,
        },
        detailText: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          fontWeight: '400',
          lineHeight: 18,
          flexShrink: 1,
        },
        chevron: {
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
          paddingHorizontal: 2,
        },
        hiddenMeridiemSpacer: {
          height: 14,
        },
        unknownSchedule: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '600',
          lineHeight: 19,
        },
      }),
    [colors],
  );

  return (
    <SurfaceCard accessibilityRole="none" style={styles.card}>
      <View style={styles.row}>
        <View style={styles.timeCol}>
          {timeParts.time === '—' ? (
            <Text style={styles.unknownSchedule}>—</Text>
          ) : (
            <>
              <Text style={styles.timeText}>{timeParts.time}</Text>
              {timeParts.meridiem ? <Text style={styles.meridiem}>{timeParts.meridiem}</Text> : <View style={styles.hiddenMeridiemSpacer} />}
              {timeParts.date ? <Text style={styles.date}>{timeParts.date}</Text> : null}
            </>
          )}
        </View>
        <View style={styles.divider} />
        <View style={styles.mainCol}>
          <View style={styles.topRow}>
            <Text numberOfLines={1} style={styles.customerName}>
              {customerName}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
              <Ionicons color={statusStyle.icon} name={statusStyle.iconName} size={12} />
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusLabel}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text numberOfLines={1} style={styles.detailText}>
              {serviceTitle}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text numberOfLines={1} style={styles.detailText}>
              {secondaryLine}
            </Text>
            <View style={styles.chevron}>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={19} />
            </View>
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}
