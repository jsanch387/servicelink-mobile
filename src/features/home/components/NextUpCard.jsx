import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, InlineCardError, SkeletonBox, SpotlightCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { openMapsForBooking, openSmsOnMyWay, phoneForSmsUri } from '../utils/appointmentOutbound';
import { hasBookingAddressForMaps } from '../utils/bookingAddress';

function NextUpSkeleton({ bone }) {
  return (
    <SpotlightCard collapsable={false} style={styles.card}>
      <SkeletonBox backgroundColor={bone} borderRadius={10} height={22} style={{ opacity: 0.35 }} width="92%" />
      <SkeletonBox backgroundColor={bone} borderRadius={8} height={18} style={{ marginTop: 12, opacity: 0.35 }} width="55%" />
      <View collapsable={false} style={styles.actions}>
        <View style={styles.actionCell}>
          <SkeletonBox backgroundColor={bone} borderRadius={14} height={52} style={{ opacity: 0.35 }} width="100%" />
        </View>
        <View style={styles.actionCell}>
          <SkeletonBox backgroundColor={bone} borderRadius={14} height={52} style={{ opacity: 0.35 }} width="100%" />
        </View>
      </View>
    </SpotlightCard>
  );
}

export function NextUpCard({
  nextBooking,
  title,
  subtitle,
  isLoading,
  businessError,
  bookingsError,
}) {
  const { colors } = useTheme();
  const scheduleError = businessError || bookingsError || null;
  const empty = !isLoading && !scheduleError && !title;
  const bone = colors.nextUpTextMuted;

  const canSms = useMemo(
    () => Boolean(nextBooking && phoneForSmsUri(nextBooking.customer_phone)),
    [nextBooking],
  );
  const canMaps = useMemo(() => hasBookingAddressForMaps(nextBooking), [nextBooking]);
  const vehicleLine = useMemo(() => {
    if (!nextBooking) {
      return '';
    }
    const parts = [
      nextBooking.customer_vehicle_year,
      nextBooking.customer_vehicle_make?.trim(),
      nextBooking.customer_vehicle_model?.trim(),
    ].filter(Boolean);
    return parts.join(' ');
  }, [nextBooking]);

  const onMyWay = useCallback(() => {
    if (nextBooking) {
      openSmsOnMyWay(nextBooking);
    }
  }, [nextBooking]);

  const navigate = useCallback(() => {
    if (nextBooking) {
      openMapsForBooking(nextBooking);
    }
  }, [nextBooking]);

  if (isLoading) {
    return <NextUpSkeleton bone={bone} />;
  }

  return (
    <SpotlightCard collapsable={false} style={styles.card}>
      {scheduleError ? (
        <InlineCardError message={scheduleError} />
      ) : empty ? (
        <Text style={[styles.empty, { color: colors.nextUpTextMuted }]}>
          No upcoming appointments.
        </Text>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.nextUpText }]}>{title}</Text>
          {vehicleLine ? (
            <Text style={[styles.vehicle, { color: colors.nextUpTextMuted }]}>{vehicleLine}</Text>
          ) : null}
          {subtitle ? (
            <Text style={[styles.countdown, { color: colors.nextUpTextMuted }]}>{subtitle}</Text>
          ) : null}
        </>
      )}

      <View collapsable={false} style={styles.actions}>
        <View collapsable={false} style={styles.actionCell}>
          <Button
            accessibilityHint={canSms ? undefined : 'Phone number required on this booking'}
            accessibilityLabel="On my way"
            disabled={empty || Boolean(scheduleError) || !canSms}
            fullWidth
            iconName="chatbubble-ellipses-outline"
            title="On my way"
            variant="surfaceDark"
            onPress={onMyWay}
          />
        </View>
        <View collapsable={false} style={styles.actionCell}>
          <Button
            accessibilityHint={canMaps ? undefined : 'Address required on this booking'}
            accessibilityLabel="Navigate"
            disabled={empty || Boolean(scheduleError) || !canMaps}
            fullWidth
            iconName="navigate-outline"
            outlineColor={colors.nextUpText}
            title="Navigate"
            variant="outline"
            onPress={navigate}
          />
        </View>
      </View>
    </SpotlightCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 8,
  },
  empty: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  countdown: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  vehicle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 8,
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  actionCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
});
