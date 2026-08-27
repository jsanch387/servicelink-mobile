import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, View } from 'react-native';
import {
  AppText,
  Button,
  InlineCardError,
  SkeletonBox,
  SlideToStartJob,
  SpotlightCard,
  TryItLabel,
} from '../../../components/ui';
import { useTheme } from '../../../theme';
import { phoneForSmsUri } from '../../../utils/phone';
import { useBookingAction } from '../../bookings/hooks/useBookingAction';
import {
  NEXT_UP_ON_MY_WAY_TRY_IT_BADGE,
  NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS,
  ON_MY_WAY_CONFIRM_DESIGN_PREVIEW,
} from '../constants/nextUpDesignFlags';
import {
  NEXT_UP_COACH_TIP_DONE,
  NEXT_UP_COACH_TIP_MARK_COMPLETE,
  NEXT_UP_COACH_TIP_ON_MY_WAY,
  NEXT_UP_COACH_TIP_SLIDE_TO_START,
} from '../constants/nextUpCoachTips';
import { useNextUpCoachTip } from '../hooks/useNextUpCoachTip';
import { useOnMyWayTryItBadge } from '../hooks/useOnMyWayTryItBadge';
import { openMapsForBooking, openSmsOnMyWay } from '../utils/appointmentOutbound';
import { hasBookingAddressForMaps } from '../utils/bookingAddress';
import {
  buildNextUpHeadlines,
  formatNextUpServiceLine,
  formatNextUpVehicleLine,
} from '../utils/nextUpCardDisplay';
import {
  resolveNextUpCardActionMode,
  resolveNextUpWorkingPhase,
  shouldShowNextUpLivePulse,
} from '../utils/resolveNextUpCardActions';
import { NextUpCoachTargetGlow } from './NextUpCoachTargetGlow';
import { NextUpCoachTip } from './NextUpCoachTip';
import { NextUpCoachWinFlash } from './NextUpCoachWinFlash';
import { NextUpNavigateIconButton } from './NextUpNavigateIconButton';
import { OnMyWayConfirmModal } from './OnMyWayConfirmModal';
import { SkipWorkNotifyConfirmModal } from './SkipWorkNotifyConfirmModal';

/**
 * Minimum inner content height for the empty Next Up state, aligned with `NextUpSkeleton`
 * and the filled upcoming card: name 29 + when 19 + service 35 + vehicle 22 + actions 78 = 183.
 * Keeps the spotlight card from shrinking when there is no booking.
 */
const NEXT_UP_CARD_BODY_MIN_HEIGHT = 183;

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

function NextUpSkeleton() {
  const { colors } = useTheme();
  const bone = colors.nextUpText;

  return (
    <SpotlightCard
      accessibilityLabel="Loading next up"
      accessibilityRole="progressbar"
      collapsable={false}
      style={styles.card}
    >
      <View style={styles.skeletonBody}>
        <SkeletonBox
          backgroundColor={bone}
          borderRadius={8}
          height={29}
          pulse
          style={styles.skeletonName}
        />
        <SkeletonBox
          backgroundColor={bone}
          borderRadius={6}
          height={16}
          pulse
          style={styles.skeletonWhen}
        />
        <SkeletonBox
          backgroundColor={bone}
          borderRadius={6}
          height={21}
          pulse
          style={styles.skeletonService}
        />
        <SkeletonBox
          backgroundColor={bone}
          borderRadius={6}
          height={19}
          pulse
          style={styles.skeletonVehicle}
        />
        <View collapsable={false} style={styles.skeletonActions}>
          <View style={styles.actionCell}>
            <SkeletonBox backgroundColor={bone} borderRadius={14} height={52} pulse width="100%" />
          </View>
          <View style={styles.actionCell}>
            <SkeletonBox backgroundColor={bone} borderRadius={14} height={52} pulse width="100%" />
          </View>
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
  businessName = null,
  spotlightMode = 'none',
  onMarkComplete,
  markCompleteLoading = false,
  workingPhase,
  onNotifyWorkFinished,
  onSkipWorkNotify,
  actionHandlers = null,
  /** When false, legacy device Messages On my way + Navigate only. */
  useLifecycleActions = NEXT_UP_USE_JOB_LIFECYCLE_ACTIONS,
  /** Launch pill on On my way (SMS lifecycle). Flip flag off after rollout. */
  showOnMyWayTryItBadge = NEXT_UP_ON_MY_WAY_TRY_IT_BADGE,
}) {
  const { colors } = useTheme();
  const bookingAction = useBookingAction(businessId);
  const scheduleError = businessError || bookingsError || null;
  const empty = !isLoading && !scheduleError && !nextBooking;

  const actionMode = useMemo(() => {
    if (!useLifecycleActions) {
      return 'upcoming';
    }
    return resolveNextUpCardActionMode(nextBooking?.job_status);
  }, [nextBooking?.job_status, useLifecycleActions]);

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

  const servicePrimaryName = useMemo(
    () => String(headlines?.servicePrimary ?? '').trim() || 'Service',
    [headlines],
  );
  const serviceExtraCount = useMemo(
    () => Math.max(0, Math.round(Number(headlines?.serviceExtraCount) || 0)),
    [headlines],
  );
  const serviceDisplayLine = useMemo(
    () =>
      formatNextUpServiceLine(
        headlines?.servicePrimary,
        headlines?.serviceDetail,
        headlines?.serviceExtraCount,
      ),
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

  const [onMyWayConfirmVisible, setOnMyWayConfirmVisible] = useState(false);
  const [workFinishedConfirmVisible, setWorkFinishedConfirmVisible] = useState(false);
  const [skipWorkNotifyConfirmVisible, setSkipWorkNotifyConfirmVisible] = useState(false);
  const [coachWin, setCoachWin] = useState(
    /** @type {{ label: string; color: string } | null} */ (null),
  );

  const hasCustomerSmsNumber = useMemo(
    () => Boolean(nextBooking && phoneForSmsUri(nextBooking.customer_phone)),
    [nextBooking],
  );
  const canMaps = useMemo(() => hasBookingAddressForMaps(nextBooking), [nextBooking]);

  const openOnMyWayConfirm = useCallback(() => {
    setOnMyWayConfirmVisible(true);
  }, []);

  // Legacy mode: the owner texts from their own phone, so hand off to Messages
  // directly. No confirm sheet — we can't know whether they actually sent it.
  const openDeviceOnMyWaySms = useCallback(() => {
    if (nextBooking) {
      void openSmsOnMyWay(nextBooking, { businessName });
    }
  }, [businessName, nextBooking]);

  const closeOnMyWayConfirm = useCallback(() => {
    setOnMyWayConfirmVisible(false);
  }, []);

  const openWorkFinishedConfirm = useCallback(() => {
    setWorkFinishedConfirmVisible(true);
  }, []);

  const closeWorkFinishedConfirm = useCallback(() => {
    setWorkFinishedConfirmVisible(false);
  }, []);

  const openSkipWorkNotifyConfirm = useCallback(() => {
    setSkipWorkNotifyConfirmVisible(true);
  }, []);

  const closeSkipWorkNotifyConfirm = useCallback(() => {
    setSkipWorkNotifyConfirmVisible(false);
  }, []);

  const confirmOnMyWay = useCallback(async () => {
    if (actionHandlers?.onOnMyWay) {
      await Promise.resolve(actionHandlers.onOnMyWay());
      return { ok: true };
    }
    if (nextBooking?.id) {
      return bookingAction.notifyOnTheWay(nextBooking.id, true, { suppressUiFeedback: true });
    }
    return { ok: false, error: { message: 'No appointment to update.' } };
  }, [actionHandlers, bookingAction, nextBooking?.id]);

  const skipOnMyWay = useCallback(() => {
    setOnMyWayConfirmVisible(false);
    if (actionHandlers?.onSkipOnMyWay) {
      actionHandlers.onSkipOnMyWay();
      return;
    }
    if (nextBooking?.id) {
      void bookingAction.notifyOnTheWay(nextBooking.id, false);
    }
  }, [actionHandlers, bookingAction, nextBooking?.id]);

  const requestSkipOnMyWay = useCallback(() => {
    Alert.alert('Skip texting?', "The customer won't be notified that you're on the way.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => skipOnMyWay() },
    ]);
  }, [skipOnMyWay]);

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
      void openMapsForBooking(nextBooking);
    }
  }, [nextBooking]);

  const confirmWorkFinished = useCallback(async () => {
    if (onNotifyWorkFinished) {
      await Promise.resolve(onNotifyWorkFinished());
      return { ok: true };
    }
    if (nextBooking?.id) {
      return bookingAction.workFinished(nextBooking.id, true, { suppressUiFeedback: true });
    }
    return { ok: false, error: { message: 'No appointment to update.' } };
  }, [bookingAction, nextBooking?.id, onNotifyWorkFinished]);

  const skipWorkNotify = useCallback(() => {
    setWorkFinishedConfirmVisible(false);
    setSkipWorkNotifyConfirmVisible(false);
    if (onSkipWorkNotify) {
      onSkipWorkNotify();
      return;
    }
    if (nextBooking?.id) {
      void bookingAction.workFinished(nextBooking.id, false);
    }
  }, [bookingAction, nextBooking?.id, onSkipWorkNotify]);

  const skipWorkFinishedFromModal = useCallback(() => {
    skipWorkNotify();
  }, [skipWorkNotify]);

  const resolvedWorkingPhase = useMemo(() => {
    if (workingPhase !== undefined) {
      return workingPhase;
    }
    return (
      resolveNextUpWorkingPhase(nextBooking?.job_status, nextBooking?.work_handoff_status) ??
      'ready'
    );
  }, [nextBooking?.job_status, nextBooking?.work_handoff_status, workingPhase]);

  const { tip: coachTip, dismissTip: dismissCoachTip } = useNextUpCoachTip({
    enabled: useLifecycleActions && !empty && !scheduleError,
    actionMode,
    workingPhase: resolvedWorkingPhase,
  });

  const {
    showBadge: showTryItBadgeOnce,
    markSeen: markTryItSeen,
    markSeenForNextTime: markTryItSeenForNextTime,
  } = useOnMyWayTryItBadge({
    enabled: useLifecycleActions && showOnMyWayTryItBadge && !empty && !scheduleError,
  });

  const showOnMyWayTryIt =
    showTryItBadgeOnce && coachTip?.id !== NEXT_UP_COACH_TIP_ON_MY_WAY && !coachWin;

  useEffect(() => {
    if (!showOnMyWayTryIt) {
      return;
    }
    void markTryItSeenForNextTime();
  }, [markTryItSeenForNextTime, showOnMyWayTryIt]);

  const completeCoachTipWithWin = useCallback(() => {
    if (!coachTip) {
      return;
    }
    if (coachTip.id === NEXT_UP_COACH_TIP_ON_MY_WAY) {
      void markTryItSeen();
    }
    setCoachWin({ label: coachTip.winLabel, color: coachTip.iconColor });
    void dismissCoachTip();
  }, [coachTip, dismissCoachTip, markTryItSeen]);

  const handleOpenOnMyWayConfirm = useCallback(() => {
    completeCoachTipWithWin();
    openOnMyWayConfirm();
  }, [completeCoachTipWithWin, openOnMyWayConfirm]);

  const handleStartJob = useCallback(() => {
    completeCoachTipWithWin();
    startJob();
  }, [completeCoachTipWithWin, startJob]);

  const handleOpenWorkFinishedConfirm = useCallback(() => {
    completeCoachTipWithWin();
    openWorkFinishedConfirm();
  }, [completeCoachTipWithWin, openWorkFinishedConfirm]);

  const handleMarkCompletePress = useCallback(() => {
    if (!onMarkComplete) {
      return;
    }
    completeCoachTipWithWin();
    void onMarkComplete();
  }, [completeCoachTipWithWin, onMarkComplete]);

  const actionSending = useLifecycleActions
    ? (actionHandlers?.isSending ?? bookingAction.isSending)
    : false;
  const actionDisabled = useLifecycleActions
    ? (actionHandlers?.disabled ?? bookingAction.disabled)
    : false;

  if (isLoading) {
    return <NextUpSkeleton />;
  }

  const showActions = !empty && !scheduleError && actionMode !== 'complete';
  const isWorking = actionMode === 'working';
  const isEnRoute = actionMode === 'en_route';
  const isUpcoming = actionMode === 'upcoming';
  const isHandoff = isWorking && resolvedWorkingPhase === 'handoff';

  return (
    <>
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
                <NextUpNavigateIconButton testID="next-up-navigate-icon" onPress={navigate} />
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

            <View style={styles.serviceRow}>
              <AppText
                ellipsizeMode="tail"
                numberOfLines={1}
                style={[styles.servicePrimary, { color: colors.nextUpText }]}
              >
                {servicePrimaryName}
              </AppText>
              {serviceExtraCount > 0 ? (
                <AppText
                  numberOfLines={1}
                  style={[styles.serviceMore, { color: colors.nextUpTextMuted }]}
                >
                  {`+${serviceExtraCount} more`}
                </AppText>
              ) : null}
            </View>

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
          <View collapsable={false} style={styles.actionsBlock}>
            {coachWin ? (
              <NextUpCoachWinFlash
                color={coachWin.color}
                label={coachWin.label}
                onDone={() => setCoachWin(null)}
              />
            ) : coachTip ? (
              <NextUpCoachTip tip={coachTip} onDismiss={() => void dismissCoachTip()} />
            ) : null}
            <View
              collapsable={false}
              style={isHandoff || isUpcoming ? styles.actions : styles.actionsSingle}
            >
              {isHandoff ? (
                <>
                  <View collapsable={false} style={styles.actionCell}>
                    <Button
                      accessibilityHint="Asks to confirm before skipping the done text"
                      accessibilityLabel="Skip"
                      disabled={actionDisabled}
                      fullWidth
                      outlineColor={colors.nextUpText}
                      title="Skip"
                      variant="outline"
                      onPress={openSkipWorkNotifyConfirm}
                    />
                  </View>
                  <View collapsable={false} style={styles.actionCell}>
                    <NextUpCoachTargetGlow
                      active={coachTip?.id === NEXT_UP_COACH_TIP_DONE}
                      color={coachTip?.iconColor ?? '#f59e0b'}
                    >
                      <Button
                        accessibilityHint={
                          hasCustomerSmsNumber
                            ? 'Asks to confirm before texting the customer that you are done'
                            : 'Add a phone on this booking to notify the customer'
                        }
                        accessibilityLabel="Done"
                        disabled={actionDisabled || !hasCustomerSmsNumber}
                        fullWidth
                        iconName="chatbubble-ellipses-outline"
                        title="Done"
                        variant="surfaceDark"
                        onPress={handleOpenWorkFinishedConfirm}
                      />
                    </NextUpCoachTargetGlow>
                  </View>
                </>
              ) : isWorking ? (
                <NextUpCoachTargetGlow
                  active={coachTip?.id === NEXT_UP_COACH_TIP_MARK_COMPLETE}
                  color={coachTip?.iconColor ?? '#0891b2'}
                >
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
                </NextUpCoachTargetGlow>
              ) : isEnRoute ? (
                <NextUpCoachTargetGlow
                  active={coachTip?.id === NEXT_UP_COACH_TIP_SLIDE_TO_START}
                  color={coachTip?.iconColor ?? '#10b981'}
                >
                  <SlideToStartJob
                    disabled={actionDisabled || !hasCustomerSmsNumber}
                    loading={actionSending}
                    surfaceTone={nextUpSurfaceTone}
                    onComplete={handleStartJob}
                  />
                </NextUpCoachTargetGlow>
              ) : isUpcoming ? (
                <>
                  <View collapsable={false} style={styles.actionCell}>
                    <NextUpCoachTargetGlow
                      active={coachTip?.id === NEXT_UP_COACH_TIP_ON_MY_WAY}
                      color={coachTip?.iconColor ?? '#0a84ff'}
                    >
                      <Button
                        accessibilityHint={
                          hasCustomerSmsNumber
                            ? useLifecycleActions
                              ? 'Asks to confirm before texting the customer that you are on the way'
                              : 'Opens Messages with a prefilled on-my-way text'
                            : 'Add a phone on this booking to notify the customer'
                        }
                        accessibilityLabel="On my way"
                        disabled={actionDisabled || !hasCustomerSmsNumber}
                        fullWidth
                        iconName="chatbubble-ellipses-outline"
                        title="On my way"
                        variant="surfaceDark"
                        onPress={
                          useLifecycleActions ? handleOpenOnMyWayConfirm : openDeviceOnMyWaySms
                        }
                      />
                    </NextUpCoachTargetGlow>
                    {showOnMyWayTryIt ? (
                      <TryItLabel
                        style={styles.onMyWayTryItBadge}
                        testID="on-my-way-try-it-badge"
                      />
                    ) : null}
                  </View>
                  <View collapsable={false} style={styles.actionCell}>
                    <Button
                      accessibilityHint={
                        canMaps
                          ? 'Opens directions in maps'
                          : 'Shows a message when this booking has no address'
                      }
                      accessibilityLabel="Navigate"
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
          </View>
        ) : null}
      </SpotlightCard>
      <OnMyWayConfirmModal
        designPreview={ON_MY_WAY_CONFIRM_DESIGN_PREVIEW}
        sendAccessibilityHint="Texts the customer that you are on the way"
        skipAccessibilityHint="Marks on the way without texting the customer"
        visible={onMyWayConfirmVisible}
        onConfirm={confirmOnMyWay}
        onRequestClose={closeOnMyWayConfirm}
        onSkip={requestSkipOnMyWay}
      />
      <OnMyWayConfirmModal
        designPreview={ON_MY_WAY_CONFIRM_DESIGN_PREVIEW}
        idleBody="Let your customer know you are done."
        sendAccessibilityHint="Texts the customer that your service is finished"
        skipAccessibilityHint="Skips texting and moves to mark complete"
        successBody="Your customer knows you’re done."
        successTitle="Text sent"
        visible={workFinishedConfirmVisible}
        onConfirm={confirmWorkFinished}
        onRequestClose={closeWorkFinishedConfirm}
        onSkip={skipWorkFinishedFromModal}
      />
      <SkipWorkNotifyConfirmModal
        visible={skipWorkNotifyConfirmVisible}
        onConfirmSkip={skipWorkNotify}
        onRequestClose={closeSkipWorkNotifyConfirm}
      />
    </>
  );
}

const styles = StyleSheet.create({
  skeletonBody: {
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
  },
  skeletonName: {
    alignSelf: 'flex-start',
    maxWidth: 220,
    minWidth: 0,
    width: '58%',
  },
  skeletonWhen: {
    alignSelf: 'flex-start',
    marginTop: 3,
    maxWidth: 168,
    minWidth: 0,
    width: '42%',
  },
  skeletonService: {
    alignSelf: 'flex-start',
    marginTop: 14,
    maxWidth: 200,
    minWidth: 0,
    width: '52%',
  },
  skeletonVehicle: {
    alignSelf: 'flex-start',
    marginTop: 3,
    maxWidth: 160,
    minWidth: 0,
    width: '40%',
  },
  skeletonActions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    marginTop: 26,
    width: '100%',
  },
  card: {
    marginTop: 10,
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
  serviceRow: {
    alignItems: 'baseline',
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    marginTop: 14,
    minWidth: 0,
  },
  servicePrimary: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.14,
    lineHeight: 21,
    minWidth: 0,
    opacity: 0.96,
  },
  serviceMore: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.05,
    lineHeight: 16,
    opacity: 0.9,
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
    width: '100%',
  },
  actionsSingle: {
    alignSelf: 'stretch',
    width: '100%',
  },
  actionsBlock: {
    alignSelf: 'stretch',
    marginTop: 26,
    width: '100%',
  },
  actionCell: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    position: 'relative',
  },
  onMyWayTryItBadge: {
    position: 'absolute',
    right: 10,
    top: -9,
    zIndex: 3,
  },
});
