import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
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
          <AppText style={styles.name}>{customer.fullName}</AppText>
          <Ionicons color={colors.placeholder} name="ellipsis-horizontal" size={22} />
        </View>

        <View style={styles.metaRow}>
          <AppText style={[styles.segment, { color: segmentColor(customer.segment) }]}>
            {segmentLabel(customer.segment)}
          </AppText>
          <View style={styles.divider} />
          <AppText style={styles.summary}>{customer.pastVisitsSummary}</AppText>
        </View>

        <View style={styles.scheduleRow}>
          <AppText style={styles.scheduleLabel}>{customer.scheduleLabel}</AppText>
          {customer.nextAppointmentDateLabel ? (
            <View style={styles.rightSchedule}>
              <AppText style={styles.scheduleDate}>{customer.nextAppointmentDateLabel}</AppText>
              {customer.nextAppointmentRelativeLabel ? (
                <AppText style={styles.scheduleRelative}>
                  {customer.nextAppointmentRelativeLabel}
                </AppText>
              ) : null}
            </View>
          ) : null}
        </View>
      </SurfaceCard>
    </Pressable>
  );
}
