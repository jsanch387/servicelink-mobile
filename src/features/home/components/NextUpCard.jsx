import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  InlineCardError,
  SkeletonBox,
  SpotlightCard,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { phoneForSmsUri } from '../../../utils/phone';
import { openMapsForBooking, openSmsOnMyWay } from '../utils/appointmentOutbound';
import { hasBookingAddressForMaps } from '../utils/bookingAddress';
import {
  buildNextUpHeadlines,
  formatNextUpServiceLine,
  formatNextUpVehicleLine,
} from '../utils/nextUpCardDisplay';

function NextUpSkeleton({ bone }) {
  return (
    <SpotlightCard collapsable={false} style={styles.card}>
      <View style={styles.skeletonHeadBlock}>
        <SkeletonBox
          backgroundColor={bone}
          borderRadius={10}
          height={22}
          pulse
          style={styles.skeletonName}
        />
        <SkeletonBox
          backgroundColor={bone}
          borderRadius={8}
          height={14}
          pulse
          style={styles.skeletonWhen}
        />
      </View>
      <SkeletonBox
        backgroundColor={bone}
        borderRadius={6}
        height={15}
        pulse
        style={{ marginTop: 22 }}
        width="72%"
      />
      <SkeletonBox
        backgroundColor={bone}
        borderRadius={6}
        height={14}
        pulse
        style={{ marginTop: 5 }}
        width="100%"
      />
      <View collapsable={false} style={styles.actions}>
        <View style={styles.actionCell}>
          <SkeletonBox backgroundColor={bone} borderRadius={12} height={50} pulse width="100%" />
        </View>
        <View style={styles.actionCell}>
          <SkeletonBox backgroundColor={bone} borderRadius={12} height={50} pulse width="100%" />
        </View>
      </View>
    </SpotlightCard>
  );
}

export function NextUpCard({ nextBooking, subtitle, isLoading, businessError, bookingsError }) {
  const { colors, isDark } = useTheme();
  const scheduleError = businessError || bookingsError || null;
  const empty = !isLoading && !scheduleError && !nextBooking;
  const bone = colors.nextUpTextMuted;

  const headlines = useMemo(
    () => (nextBooking ? buildNextUpHeadlines(nextBooking) : null),
    [nextBooking],
  );

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

  const serviceDisplayLine = useMemo(
    () =>
      headlines ? formatNextUpServiceLine(headlines.servicePrimary, headlines.serviceDetail) : '',
    [headlines],
  );

  const vehicleOnlyLine = useMemo(() => formatNextUpVehicleLine(vehicleLine), [vehicleLine]);

  const a11ySummary = useMemo(() => {
    if (!headlines) return undefined;
    const parts = [headlines.customerName];
    if (subtitle) parts.push(subtitle);
    parts.push(serviceDisplayLine);
    if (vehicleOnlyLine) parts.push(vehicleOnlyLine);
    return parts.join('. ');
  }, [headlines, serviceDisplayLine, subtitle, vehicleOnlyLine]);

  const canSms = useMemo(
    () => Boolean(nextBooking && phoneForSmsUri(nextBooking.customer_phone)),
    [nextBooking],
  );
  const canMaps = useMemo(() => hasBookingAddressForMaps(nextBooking), [nextBooking]);

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

  const showActions = !empty && !scheduleError;

  return (
    <SpotlightCard
      accessibilityLabel={!empty && !scheduleError ? a11ySummary : undefined}
      collapsable={false}
      style={styles.card}
    >
      {scheduleError ? (
        <InlineCardError message={scheduleError} />
      ) : empty ? (
        <View style={styles.emptyWrap}>
          <View
            style={[
              styles.emptyIconWrap,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          >
            <Ionicons color={colors.nextUpTextMuted} name="calendar-outline" size={20} />
          </View>
          <AppText style={[styles.emptyTitle, { color: colors.nextUpText }]}>
            Nothing scheduled yet
          </AppText>
          <AppText style={[styles.emptyBody, { color: colors.nextUpTextMuted }]}>
            Your next booking will show up here.
          </AppText>
        </View>
      ) : (
        <View style={styles.contentColumn}>
          <AppText
            ellipsizeMode="tail"
            numberOfLines={2}
            style={[styles.customerName, { color: colors.nextUpText }]}
          >
            {headlines?.customerName}
          </AppText>
          {subtitle ? (
            <AppText
              ellipsizeMode="tail"
              numberOfLines={2}
              style={[styles.whenBelowName, { color: colors.nextUpTextMuted }]}
            >
              {subtitle}
            </AppText>
          ) : null}

          <AppText
            ellipsizeMode="tail"
            numberOfLines={2}
            style={[styles.servicePrimary, { color: colors.nextUpText }]}
          >
            {serviceDisplayLine}
          </AppText>

          {vehicleOnlyLine ? (
            <AppText
              ellipsizeMode="tail"
              numberOfLines={3}
              style={[styles.vehicleAndType, { color: colors.nextUpTextMuted }]}
            >
              {vehicleOnlyLine}
            </AppText>
          ) : null}
        </View>
      )}

      {showActions ? (
        <View collapsable={false} style={styles.actions}>
          <View collapsable={false} style={styles.actionCell}>
            <Button
              accessibilityHint={canSms ? undefined : 'Phone number required on this booking'}
              accessibilityLabel="On my way"
              disabled={!canSms}
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
              disabled={!canMaps}
              fullWidth
              iconName="navigate-outline"
              outlineColor={colors.nextUpText}
              title="Navigate"
              variant="outline"
              onPress={navigate}
            />
          </View>
        </View>
      ) : null}
    </SpotlightCard>
  );
}

const styles = StyleSheet.create({
  skeletonHeadBlock: {
    alignSelf: 'stretch',
    gap: 10,
    minWidth: 0,
  },
  skeletonName: {
    alignSelf: 'stretch',
    maxWidth: '72%',
    minWidth: 0,
  },
  skeletonWhen: {
    alignSelf: 'flex-start',
    maxWidth: 200,
    minWidth: 0,
    width: '48%',
  },
  card: {
    marginTop: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingBottom: 4,
    paddingTop: 4,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
    width: 44,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.25,
    lineHeight: 21,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 280,
    textAlign: 'center',
  },
  contentColumn: {
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
  },
  customerName: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.55,
    lineHeight: 29,
    width: '100%',
  },
  whenBelowName: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.02,
    lineHeight: 16,
    marginTop: 3,
    opacity: 0.9,
    width: '100%',
  },
  servicePrimary: {
    alignSelf: 'stretch',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.14,
    lineHeight: 21,
    marginTop: 14,
    minWidth: 0,
    opacity: 0.96,
  },
  vehicleAndType: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 19,
    letterSpacing: -0.05,
    alignSelf: 'stretch',
    marginTop: 3,
    minWidth: 0,
    opacity: 0.88,
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    marginTop: 26,
    width: '100%',
  },
  actionCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
});
