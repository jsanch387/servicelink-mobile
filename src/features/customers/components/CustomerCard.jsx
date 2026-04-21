import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { CUSTOMER_FILTER_DUE, CUSTOMER_FILTER_NEW, CUSTOMER_FILTER_RETURNING } from '../constants';

function segmentLabel(segment) {
  if (segment === CUSTOMER_FILTER_NEW) {
    return 'New';
  }
  if (segment === CUSTOMER_FILTER_RETURNING) {
    return 'Returning';
  }
  if (segment === CUSTOMER_FILTER_DUE) {
    return 'Due';
  }
  return 'All';
}

function segmentColor(segment) {
  if (segment === CUSTOMER_FILTER_RETURNING) {
    return '#34d399';
  }
  if (segment === CUSTOMER_FILTER_DUE) {
    return '#fcd34d';
  }
  return '#38bdf8';
}

export function CustomerCard({ customer, onPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          marginBottom: 12,
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        topRow: {
          alignItems: 'center',
          flexDirection: 'row',
          justifyContent: 'space-between',
          minHeight: 24,
        },
        name: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          marginRight: 10,
        },
        metaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: 8,
        },
        segment: {
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        divider: {
          backgroundColor: colors.borderStrong,
          height: 14,
          marginHorizontal: 8,
          width: 1,
        },
        summary: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '400',
          letterSpacing: -0.1,
        },
        scheduleRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 16,
        },
        scheduleLabel: {
          color: colors.placeholder,
          fontSize: 13,
          fontWeight: '400',
          letterSpacing: -0.1,
          marginRight: 8,
        },
        rightSchedule: {
          alignItems: 'flex-end',
        },
        scheduleDate: {
          color: colors.text,
          fontSize: 13,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 16,
        },
        scheduleRelative: {
          color: colors.placeholder,
          fontSize: 13,
          fontWeight: '400',
          letterSpacing: -0.1,
          lineHeight: 16,
          marginTop: 2,
        },
      }),
    [colors],
  );

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <SurfaceCard padding="none" style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{customer.fullName}</Text>
          <Ionicons color={colors.placeholder} name="ellipsis-horizontal" size={22} />
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.segment, { color: segmentColor(customer.segment) }]}>
            {segmentLabel(customer.segment)}
          </Text>
          <View style={styles.divider} />
          <Text style={styles.summary}>{customer.pastVisitsSummary}</Text>
        </View>

        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>{customer.scheduleLabel}</Text>
          {customer.nextAppointmentDateLabel ? (
            <View style={styles.rightSchedule}>
              <Text style={styles.scheduleDate}>{customer.nextAppointmentDateLabel}</Text>
              {customer.nextAppointmentRelativeLabel ? (
                <Text style={styles.scheduleRelative}>{customer.nextAppointmentRelativeLabel}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </SurfaceCard>
    </Pressable>
  );
}
