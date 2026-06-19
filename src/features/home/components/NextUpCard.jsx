import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  EchoBarsLoader,
  InlineCardError,
  SkeletonBox,
  SlideToStartJob,
  SpotlightCard,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { phoneForSmsUri } from '../../../utils/phone';
import { useBookingAction } from '../../bookings/hooks/useBookingAction';
import { openMapsForBooking } from '../utils/appointmentOutbound';
import { hasBookingAddressForMaps } from '../utils/bookingAddress';
import { buildNextUpHeadlines, formatNextUpVehicleLine } from '../utils/nextUpCardDisplay';
import {
  resolveNextUpCardActionMode,
  resolveNextUpWorkingPhase,
  shouldShowNextUpLivePulse,
} from '../utils/resolveNextUpCardActions';
import { NextUpNavigateIconButton } from './NextUpNavigateIconButton';

/**
 * Minimum inner content height for the empty Next Up state, aligned with `NextUpSkeleton`:
 * headline block (22 + 10 + 14) + service lines (22 + 15 + 5 + 14) + actions (26 + 50) = 178.
 * Keeps the spotlight card from shrinking when there is no booking.
 */
const NEXT_UP_CARD_BODY_MIN_HEIGHT = 178;

const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

function LivePulseIndicator({ color, opacityAnim, ringScaleAnim, ringOpacityAnim }) {
  return (
    <View style={styles.livePulseHost} testID="next-up-live-pulse">
      <Animated.View
        accessible={false}
        style={[
          styles.livePulseRing,
          {
            borderColor: color,
            opacity: ringOpacityAnim,
            transform: [{ scale: ringScaleAnim }],
          },
        ]}
      />
      <Animated.View
        accessible={false}
        style={[
          styles.livePulseDot,
          {
            backgroundColor: color,
            opacity: opacityAnim,
          },
        ]}
      />
    </View>
  );
}

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

export function NextUpCard({
  nextBooking,
  subtitle,
  isLoading,
  businessError,
  bookingsError,
  businessId,
  spotlightMode = 'none',
  onMarkComplete,
  markCompleteLoading = false,
  workingPhase,
  onNotifyWorkFinished,
  onSkipWorkNotify,
  actionHandlers = null,
}) {
  const { colors } = useTheme();
  const bookingAction = useBookingAction(businessId);
  const scheduleError = businessError || bookingsError || null;
  const empty = !isLoading && !scheduleError && !nextBooking;
  const bone = colors.nextUpTextMuted;

  const actionMode = useMemo(
    () => resolveNextUpCardActionMode(nextBooking?.job_status),
    [nextBooking?.job_status],
  );

  const showLivePulse = useMemo(() => shouldShowNextUpLivePulse(actionMode), [actionMode]);

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
    () => String(headlines?.servicePrimary ?? '').trim() || 'Service',
    [headlines],
  );

  const vehicleOnlyLine = useMemo(() => formatNextUpVehicleLine(vehicleLine), [vehicleLine]);

  const livePulseDotColor = useMemo(() => {
    const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
    return lightFace ? '#059669' : '#34d399';
  }, [colors.nextUpSurface]);

  const inProgressPrimaryVariant = useMemo(() => {
    const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
    return lightFace ? 'surfaceDark' : 'surfaceLight';
  }, [colors.nextUpSurface]);

  const emptyCalendarBadge = useMemo(() => {
    const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
    return {
      wrapBg: lightFace ? '#000000' : '#ffffff',
      iconColor: lightFace ? '#ffffff' : '#0a0a0a',
    };
  }, [colors.nextUpSurface]);

  const nextUpSurfaceTone = useMemo(() => {
    const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
    return lightFace ? 'light' : 'dark';
  }, [colors.nextUpSurface]);

  const navigateIconColor = useMemo(() => {
    const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
    return lightFace ? '#0a0a0a' : '#fafafa';
  }, [colors.nextUpSurface]);

  const livePulseOpacity = useRef(new Animated.Value(1)).current;
  const livePulseRingScale = useRef(new Animated.Value(1)).current;
  const livePulseRingOpacity = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    if (!showLivePulse || !enableMotion) {
      livePulseOpacity.setValue(1);
      livePulseRingScale.setValue(1);
      livePulseRingOpacity.setValue(showLivePulse ? 0.42 : 0);
      return undefined;
    }
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(livePulseOpacity, {
            toValue: 0.45,
            duration: 680,
            useNativeDriver: true,
          }),
          Animated.timing(livePulseOpacity, {
            toValue: 1,
            duration: 680,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(livePulseRingScale, {
            toValue: 2.15,
            duration: 680,
            useNativeDriver: true,
          }),
          Animated.timing(livePulseRingScale, {
            toValue: 1,
            duration: 680,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(livePulseRingOpacity, {
            toValue: 0,
            duration: 680,
            useNativeDriver: true,
          }),
          Animated.timing(livePulseRingOpacity, {
            toValue: 0.42,
            duration: 680,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [showLivePulse, livePulseOpacity, livePulseRingOpacity, livePulseRingScale]);

  const a11ySummary = useMemo(() => {
    if (!headlines) return undefined;
    const parts = [];
    if (actionMode === 'working' || spotlightMode === 'in_progress') {
      parts.push('In progress');
    }
    parts.push(headlines.customerName);
    if (subtitle) parts.push(subtitle);
    parts.push(serviceDisplayLine);
    if (vehicleOnlyLine) parts.push(vehicleOnlyLine);
    return parts.join('. ');
  }, [actionMode, headlines, serviceDisplayLine, spotlightMode, subtitle, vehicleOnlyLine]);

  const hasCustomerSmsNumber = useMemo(
    () => Boolean(nextBooking && phoneForSmsUri(nextBooking.customer_phone)),
    [nextBooking],
  );
  const canMaps = useMemo(() => hasBookingAddressForMaps(nextBooking), [nextBooking]);

  const onMyWay = useCallback(() => {
    if (actionHandlers?.onOnMyWay) {
      actionHandlers.onOnMyWay();
      return;
    }
    if (nextBooking?.id) {
      bookingAction.notifyOnTheWay(nextBooking.id);
    }
  }, [actionHandlers, nextBooking?.id, bookingAction]);

  const startJob = useCallback(() => {
    if (actionHandlers?.onStartJob) {
      actionHandlers.onStartJob();
      return;
    }
    if (nextBooking?.id) {
      bookingAction.startJob(nextBooking.id);
    }
  }, [actionHandlers, bookingAction, nextBooking?.id]);

  const navigate = useCallback(() => {
    if (nextBooking) {
      openMapsForBooking(nextBooking);
    }
  }, [nextBooking]);

  const handleMarkCompletePress = useCallback(() => {
    if (!onMarkComplete) {
      return;
    }
    void onMarkComplete();
  }, [onMarkComplete]);

  const notifyWorkFinished = useCallback(() => {
    if (onNotifyWorkFinished) {
      onNotifyWorkFinished();
      return;
    }
    if (nextBooking?.id) {
      bookingAction.workFinished(nextBooking.id, true);
    }
  }, [bookingAction, nextBooking?.id, onNotifyWorkFinished]);

  const skipWorkNotify = useCallback(() => {
    if (onSkipWorkNotify) {
      onSkipWorkNotify();
      return;
    }
    if (nextBooking?.id) {
      bookingAction.workFinished(nextBooking.id, false);
    }
  }, [bookingAction, nextBooking?.id, onSkipWorkNotify]);

  const resolvedWorkingPhase = useMemo(() => {
    if (workingPhase !== undefined) {
      return workingPhase;
    }
    return (
      resolveNextUpWorkingPhase(nextBooking?.job_status, nextBooking?.work_handoff_status) ??
      'ready'
    );
  }, [nextBooking?.job_status, nextBooking?.work_handoff_status, workingPhase]);
  const actionSending = actionHandlers?.isSending ?? bookingAction.isSending;
  const actionDisabled = actionHandlers?.disabled ?? bookingAction.disabled;

  if (isLoading) {
    return <NextUpSkeleton bone={bone} />;
  }

  const showActions = !empty && !scheduleError && actionMode !== 'complete';
  const isWorking = actionMode === 'working';
  const isEnRoute = actionMode === 'en_route';
  const isUpcoming = actionMode === 'upcoming';
  const isHandoff = isWorking && resolvedWorkingPhase === 'handoff';

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
          <View style={[styles.emptyIconWrap, { backgroundColor: emptyCalendarBadge.wrapBg }]}>
            <Ionicons color={emptyCalendarBadge.iconColor} name="calendar-outline" size={20} />
          </View>
          <View style={styles.emptyTextColumn}>
            <AppText style={[styles.emptyTitle, { color: colors.nextUpText }]}>
              Nothing scheduled yet
            </AppText>
            <AppText style={[styles.emptyBody, { color: colors.nextUpTextMuted }]}>
              Your next booking will show up here.
            </AppText>
          </View>
        </View>
      ) : (
        <View style={styles.contentColumn}>
          {isEnRoute ? (
            <View pointerEvents="box-none" style={styles.navigateIconOverlay}>
              <NextUpNavigateIconButton
                canMaps={canMaps}
                testID="next-up-navigate-icon"
                onPress={navigate}
              />
            </View>
          ) : null}
          {actionMode === 'working' ? (
            <View style={styles.nameRow}>
              <AppText
                ellipsizeMode="tail"
                numberOfLines={2}
                style={[styles.customerNameInRow, { color: colors.nextUpText }]}
              >
                {headlines?.customerName}
              </AppText>
              <LivePulseIndicator
                color={livePulseDotColor}
                opacityAnim={livePulseOpacity}
                ringOpacityAnim={livePulseRingOpacity}
                ringScaleAnim={livePulseRingScale}
              />
            </View>
          ) : (
            <AppText
              ellipsizeMode="tail"
              numberOfLines={2}
              style={[
                styles.customerName,
                isEnRoute && styles.customerNameWithNavigateOverlay,
                { color: colors.nextUpText },
              ]}
            >
              {headlines?.customerName}
            </AppText>
          )}
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
        <View
          collapsable={false}
          style={isHandoff || isUpcoming ? styles.actions : styles.actionsSingle}
        >
          {isHandoff ? (
            <>
              <View collapsable={false} style={styles.actionCell}>
                <Button
                  accessibilityHint={
                    hasCustomerSmsNumber
                      ? 'Texts the customer that your service is finished'
                      : 'Add a phone on this booking to notify the customer'
                  }
                  accessibilityLabel="Done"
                  disabled={actionDisabled || !hasCustomerSmsNumber}
                  fullWidth
                  iconName="chatbubble-ellipses-outline"
                  loading={actionSending}
                  loadingNode={<EchoBarsLoader accessibilityLabel="Sending" color="#ffffff" />}
                  title="Done"
                  variant="surfaceDark"
                  onPress={notifyWorkFinished}
                />
              </View>
              <View collapsable={false} style={styles.actionCell}>
                <Button
                  accessibilityHint="Skips texting and moves to mark complete"
                  accessibilityLabel="Skip"
                  disabled={actionDisabled}
                  fullWidth
                  outlineColor={colors.nextUpText}
                  title="Skip"
                  variant="outline"
                  onPress={skipWorkNotify}
                />
              </View>
            </>
          ) : isWorking ? (
            <Button
              accessibilityHint={
                onMarkComplete ? undefined : 'Mark complete is not available right now'
              }
              accessibilityLabel="Mark complete"
              disabled={!onMarkComplete || markCompleteLoading}
              fullWidth
              iconName="checkmark-done-outline"
              loading={markCompleteLoading}
              title="Mark complete"
              variant={inProgressPrimaryVariant}
              onPress={handleMarkCompletePress}
            />
          ) : isEnRoute ? (
            <SlideToStartJob
              disabled={actionDisabled || !hasCustomerSmsNumber}
              loading={actionSending}
              surfaceTone={nextUpSurfaceTone}
              onComplete={startJob}
            />
          ) : isUpcoming ? (
            <>
              <View collapsable={false} style={styles.actionCell}>
                <Button
                  accessibilityHint={
                    hasCustomerSmsNumber
                      ? 'Texts the customer that you are on the way'
                      : 'Add a phone on this booking to notify the customer'
                  }
                  accessibilityLabel="On my way"
                  disabled={actionDisabled || !hasCustomerSmsNumber}
                  fullWidth
                  iconName="chatbubble-ellipses-outline"
                  loading={actionSending}
                  loadingNode={<EchoBarsLoader accessibilityLabel="Sending" color="#ffffff" />}
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
                  iconColor={navigateIconColor}
                  iconName="navigate"
                  outlineColor={colors.nextUpText}
                  title="Navigate"
                  variant="outline"
                  onPress={navigate}
                />
              </View>
            </>
          ) : null}
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
    /** Match `RestOfTodayCard` empty-state wrap padding. */
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    minHeight: NEXT_UP_CARD_BODY_MIN_HEIGHT,
  },
  emptyIconWrap: {
    alignItems: 'center',
    borderRadius: 999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyTextColumn: {
    alignSelf: 'center',
    maxWidth: 280,
    width: '100%',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.25,
    lineHeight: 21,
    /** Match timeline empty: icon → title gap via title `marginTop` (not icon `marginBottom`). */
    marginTop: 10,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    /** Match timeline empty title → body rhythm. */
    marginTop: 4,
    textAlign: 'center',
  },
  contentColumn: {
    alignSelf: 'stretch',
    minWidth: 0,
    position: 'relative',
    width: '100%',
  },
  navigateIconOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 2,
  },
  customerNameWithNavigateOverlay: {
    paddingRight: 56,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    width: '100%',
  },
  customerNameInRow: {
    flex: 1,
    flexShrink: 1,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.55,
    lineHeight: 29,
    minWidth: 0,
  },
  livePulseHost: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    marginTop: 8,
    width: 24,
  },
  livePulseRing: {
    borderRadius: 99,
    borderWidth: 2,
    height: 12,
    position: 'absolute',
    width: 12,
  },
  livePulseDot: {
    borderRadius: 99,
    height: 12,
    width: 12,
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
  actionsSingle: {
    alignSelf: 'stretch',
    marginTop: 26,
    width: '100%',
  },
  actionCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
  },
});
