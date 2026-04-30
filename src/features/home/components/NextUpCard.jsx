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
      <View style={styles.skeletonHeadlineRow}>
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
          height={34}
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
    const parts = [headlines.customerName, serviceDisplayLine];
    if (vehicleOnlyLine) parts.push(vehicleOnlyLine);
    if (subtitle) parts.push(subtitle);
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
          <View style={styles.headlineRow}>
            <View style={styles.customerNameCol}>
              <AppText
                ellipsizeMode="tail"
                numberOfLines={2}
                style={[styles.customerName, { color: colors.nextUpText }]}
              >
                {headlines?.customerName}
              </AppText>
            </View>
            {subtitle ? (
              <View style={styles.whenColumn}>
                <AppText
                  ellipsizeMode="tail"
                  numberOfLines={3}
                  style={[styles.whenInline, { color: colors.nextUpTextMuted }]}
                >
                  {subtitle}
                </AppText>
              </View>
            ) : null}
          </View>

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
  skeletonHeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  skeletonName: {
    flex: 1,
    minWidth: 0,
    maxWidth: '58%',
  },
  skeletonWhen: {
    width: '38%',
    maxWidth: 120,
    minHeight: 34,
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
  headlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  customerNameCol: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  whenColumn: {
    flexShrink: 0,
    maxWidth: '44%',
    minWidth: 0,
    paddingLeft: 6,
    alignItems: 'flex-end',
  },
  whenInline: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.15,
    lineHeight: 15,
    textAlign: 'right',
    opacity: 0.92,
  },
  customerName: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.55,
    lineHeight: 29,
    width: '100%',
  },
  servicePrimary: {
    alignSelf: 'stretch',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.14,
    lineHeight: 21,
    marginTop: 18,
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
