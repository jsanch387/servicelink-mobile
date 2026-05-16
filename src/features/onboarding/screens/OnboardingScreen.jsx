import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, InlineCardError } from '../../../components/ui';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { BUSINESS_TYPE_OPTIONS } from '../../../constants/businessTypeOptions';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useBusinessAvailability } from '../../availability/hooks/useBusinessAvailability';
import { buildAvailabilityUiFromPreset } from '../../availability/utils/availabilityModel';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { getBookingLinkDisplay } from '../../home/utils/bookingLink';
import { sanitizeBusinessSlugForSave } from '../../more/utils/businessSlug';
import { fetchBusinessServices } from '../../services/api/services';
import { queryClient } from '../../../lib/queryClient';
import { BOOKING_LINK_QUERY_KEY } from '../../bookingLink/queryKeys';
import { accountSettingsQueryKey } from '../../more/queryKeys';
import { resolveStripeMobileCheckoutOrigin } from '../../../lib/stripeMobileCheckoutOrigin';
import { confirmOnboardingTrialUntilReady } from '../utils/confirmOnboardingTrialUntilReady';
import { createOnboardingCheckoutSession } from '../api/createOnboardingCheckoutSession';
import { parseCheckoutSessionIdFromOnboardingReturnUrl } from '../utils/parseOnboardingStripeReturnUrl';
import { completeOnboardingV2 } from '../api/completeOnboardingV2';
import { startOnboardingTrial } from '../api/startOnboardingTrial';
import {
  MAX_ONBOARDING_BUSINESS_NAME_LENGTH,
  MAX_ONBOARDING_SERVICE_DESCRIPTION_LENGTH,
  MAX_ONBOARDING_SERVICE_NAME_LENGTH,
  MAX_ONBOARDING_SERVICE_PRICE_INPUT_LENGTH,
} from '../constants/onboardingInputLimits';
import {
  clearPendingBookingLinkNavigation,
  setPendingNavigateToBookingLink,
} from '../constants/postOnboardingNavigation';
import { ENABLE_ONBOARDING_STRIPE_TRIAL } from '../constants/onboardingStripeTrialFlag';
import { STRIPE_ONBOARDING_CHECKOUT_AUTH_RETURN_URL } from '../constants/stripeOnboardingReturnUrl';
import {
  saveOnboardingStep1,
  saveOnboardingStep2Services,
  saveOnboardingStep3Availability,
  saveOnboardingStep4Slug,
} from '../api/onboardingV2Api';
import { refetchOnboardingAfterStripe } from '../utils/refetchOnboardingAfterStripe';
import { WeeklyScheduleSection } from '../../availability/components/WeeklyScheduleSection';
import { OnboardingBusinessStepCard } from '../components/OnboardingBusinessStepCard';
import { OnboardingProgressStepper } from '../components/OnboardingProgressStepper';
import { OnboardingServicesStep } from '../components/OnboardingServicesStep';
import { OnboardingSlugStep } from '../components/OnboardingSlugStep';
import { OnboardingTrialStep } from '../components/OnboardingTrialStep';
import { useOnboardingGate } from '../context/OnboardingGateContext';

const STEP_COUNT = 5;

const STEP_TITLES = [
  'Business details',
  'Add a service',
  'When do you work?',
  'Claim your link',
  'Go live',
];

const STEP_SUBTITLES = [
  '',
  'Add at least one service — you can add the rest later.',
  'Pick your usual hours. Customers will only see times when you are free.',
  'This will be the booking link you share with customers.',
  'Go live, share your link, get bookings.',
];

function isValidBusinessType(value) {
  const v = String(value ?? '').trim();
  return v.length > 0 && BUSINESS_TYPE_OPTIONS.some((o) => o.value === v);
}

function centsToPriceInput(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) {
    return '';
  }
  return String(n / 100);
}

export function OnboardingScreen() {
  const { colors } = useTheme();
  const { session, user } = useAuth();
  const userId = user?.id ?? null;
  const {
    refetchOnboarding,
    onboardingStep,
    isOnboardingProfileLoaded,
    profileLoadError,
    beginPostActivationHandoff,
    endPostActivationHandoff,
  } = useOnboardingGate();
  const [stepIndex, setStepIndex] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [stepError, setStepError] = useState('');
  const [step1Submitting, setStep1Submitting] = useState(false);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [remoteStepSaving, setRemoteStepSaving] = useState(false);

  const availabilityBoot = useBusinessAvailability();
  const monFriPreset = useMemo(() => buildAvailabilityUiFromPreset('mon_fri_9_5'), []);
  const [servicesList, setServicesList] = useState([]);
  const [schedulePreset, setSchedulePreset] = useState(monFriPreset.selectedPreset);
  const [dayEnabledMap, setDayEnabledMap] = useState(() => ({ ...monFriPreset.dayEnabledMap }));
  const [dayTimeRanges, setDayTimeRanges] = useState(() => ({ ...monFriPreset.dayTimeRanges }));
  const [linkSlugDraft, setLinkSlugDraft] = useState('');

  const seededAvailRef = useRef(false);
  const slugSeededRef = useRef(false);
  const prevStepIndexRef = useRef(0);
  const didHydrateStepFromServerRef = useRef(false);
  const scrollViewRef = useRef(null);

  /** One ScrollView for all steps — reset offset on step change so each step starts at the top. */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    });
    return () => cancelAnimationFrame(id);
  }, [stepIndex]);

  useEffect(() => {
    didHydrateStepFromServerRef.current = false;
  }, [userId]);

  /**
   * Resume once from `profiles.onboarding_step` when the profile query succeeds.
   * After that, step changes are driven by Next/Back + explicit advances so going back
   * and re-saving does not fight a "server target > local" sync.
   */
  useEffect(() => {
    if (profileLoadError || !isOnboardingProfileLoaded) {
      return;
    }
    if (didHydrateStepFromServerRef.current) {
      return;
    }
    didHydrateStepFromServerRef.current = true;
    const target = Math.min(STEP_COUNT - 1, Math.max(0, onboardingStep - 1));
    setStepIndex(target);
  }, [profileLoadError, isOnboardingProfileLoaded, onboardingStep]);

  /** Whenever we land on Services, reload from the server so Back / reload shows saved rows. */
  useEffect(() => {
    const businessId = availabilityBoot.businessId;
    if (stepIndex !== 1 || !businessId) {
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchBusinessServices(businessId);
      if (cancelled || error) {
        return;
      }
      if (!Array.isArray(data) || data.length === 0) {
        setServicesList([]);
        return;
      }
      setServicesList(
        data.map((row) => ({
          id: String(row.id),
          name: String(row.name ?? '').trim(),
          description: String(row.description ?? '').trim(),
          priceInput: centsToPriceInput(row.price_cents),
          durationMinutes: Math.max(30, Number(row.duration_minutes) || 60),
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [stepIndex, availabilityBoot.businessId]);

  /** Business step: fill name + type from `business_profiles` when returning or after reload. */
  useEffect(() => {
    if (stepIndex !== 0 || !userId) {
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (cancelled || error || !data?.id) {
        return;
      }
      const name = String(data.business_name ?? '').trim();
      const type = String(data.business_type ?? '').trim();
      setBusinessName((prev) => (name ? name : prev));
      setBusinessType((prev) => (type ? type : prev));
    })();
    return () => {
      cancelled = true;
    };
  }, [stepIndex, userId]);

  /**
   * Hydrate schedule from React Query when opening the step (e.g. reload or Services → Schedule).
   * When returning from Link (step 3), keep parent state so unsaved or in-memory edits are not
   * replaced by a stale cached `availabilityBoot.model` before refetch completes.
   */
  useEffect(() => {
    const from = prevStepIndexRef.current;
    prevStepIndexRef.current = stepIndex;

    if (stepIndex !== 2) {
      seededAvailRef.current = false;
      return;
    }

    if (availabilityBoot.isLoading) {
      return;
    }

    if (from === 3) {
      seededAvailRef.current = true;
      return;
    }

    if (seededAvailRef.current) {
      return;
    }

    const m = availabilityBoot.model;
    setSchedulePreset(m.selectedPreset ?? 'mon_fri_9_5');
    setDayEnabledMap({ ...m.dayEnabledMap });
    setDayTimeRanges({ ...m.dayTimeRanges });
    seededAvailRef.current = true;
  }, [stepIndex, availabilityBoot.isLoading, availabilityBoot.model]);

  useEffect(() => {
    if (stepIndex !== 3) {
      slugSeededRef.current = false;
    }
  }, [stepIndex]);

  useEffect(() => {
    if (stepIndex !== 3 || !userId || slugSeededRef.current) {
      return;
    }
    slugSeededRef.current = true;
    let cancelled = false;
    (async () => {
      const { data } = await fetchBusinessProfileForUser(userId);
      if (cancelled) {
        return;
      }
      const raw = data?.business_slug;
      if (raw != null && String(raw).trim()) {
        setLinkSlugDraft((prev) => (String(prev ?? '').trim() ? prev : String(raw).trim()));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stepIndex, userId]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: {
          flex: 1,
          backgroundColor: colors.shell,
        },
        keyboard: {
          flex: 1,
        },
        stepperHeader: {
          paddingBottom: 4,
          paddingHorizontal: 16,
          paddingTop: 8,
        },
        scroll: {
          flex: 1,
        },
        scrollContent: {
          flexGrow: 1,
          paddingBottom: 12,
          paddingHorizontal: 16,
          paddingTop: 0,
        },
        mainBody: {
          flex: 1,
        },
        actionsBar: {
          backgroundColor: colors.shell,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          gap: 12,
          paddingBottom: 8,
          paddingHorizontal: 16,
          paddingTop: 12,
        },
        loadErrorBox: {
          marginBottom: 16,
        },
        loadErrorRetry: {
          marginTop: 12,
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
          letterSpacing: -0.3,
          marginBottom: 8,
          textAlign: 'left',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: 20,
          textAlign: 'left',
        },
        /** Same size as `title`; one weight step heavier (800 vs 700). */
        goLiveTitle: {
          fontWeight: '800',
        },
        goLiveInlineEmph: {
          color: colors.text,
          fontWeight: '700',
        },
        copy: {
          color: colors.textMuted,
          fontSize: 16,
          lineHeight: 24,
          textAlign: 'left',
        },
        stepErrorWrap: {
          marginBottom: 12,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        flex: {
          flex: 1,
        },
        businessTypeHint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 12,
        },
      }),
    [colors],
  );

  const goNext = async () => {
    if (stepIndex === 0) {
      const name = businessName.trim();
      if (!name) {
        setStepError('Enter your business name.');
        return;
      }
      if (name.length > MAX_ONBOARDING_BUSINESS_NAME_LENGTH) {
        setStepError(
          `Business name must be ${MAX_ONBOARDING_BUSINESS_NAME_LENGTH} characters or fewer.`,
        );
        return;
      }
      if (!isValidBusinessType(businessType)) {
        setStepError('Choose a business type.');
        return;
      }
      setStepError('');
      setStep1Submitting(true);
      const res = await saveOnboardingStep1({
        businessName: name,
        businessType,
      });
      setStep1Submitting(false);
      if (!res.ok) {
        setStepError(safeUserFacingMessage(res.error, { fallback: 'Could not save. Try again.' }));
        return;
      }
      await refetchOnboarding();
      setStepIndex((i) => Math.min(STEP_COUNT - 1, i + 1));
      return;
    }

    if (stepIndex === 1) {
      if (servicesList.length === 0) {
        setStepError('Add at least one service to continue.');
        return;
      }
      for (const s of servicesList) {
        const n = String(s?.name ?? '').trim();
        const d = String(s?.description ?? '').trim();
        const p = String(s?.priceInput ?? '')
          .replace(/\$/g, '')
          .trim();
        if (n.length > MAX_ONBOARDING_SERVICE_NAME_LENGTH) {
          setStepError(
            `Each service name must be ${MAX_ONBOARDING_SERVICE_NAME_LENGTH} characters or fewer.`,
          );
          return;
        }
        if (d.length > MAX_ONBOARDING_SERVICE_DESCRIPTION_LENGTH) {
          setStepError(
            `Each description must be ${MAX_ONBOARDING_SERVICE_DESCRIPTION_LENGTH} characters or fewer.`,
          );
          return;
        }
        if (p.length > MAX_ONBOARDING_SERVICE_PRICE_INPUT_LENGTH) {
          setStepError('One of your prices is too long. Enter a smaller amount.');
          return;
        }
      }
      setStepError('');
      setRemoteStepSaving(true);
      const res = await saveOnboardingStep2Services({
        services: servicesList.map((s) => ({
          name: s.name,
          description: s.description,
          priceInput: s.priceInput,
          durationMinutes: s.durationMinutes,
        })),
      });
      setRemoteStepSaving(false);
      if (!res.ok) {
        setStepError(safeUserFacingMessage(res.error, { fallback: 'Could not save services.' }));
        return;
      }
      await refetchOnboarding();
      setStepIndex((i) => Math.min(STEP_COUNT - 1, i + 1));
      return;
    }

    if (stepIndex === 2) {
      setStepError('');
      setRemoteStepSaving(true);
      const res = await saveOnboardingStep3Availability({
        dayEnabledMap,
        dayTimeRanges,
        selectedPreset: schedulePreset,
      });
      setRemoteStepSaving(false);
      if (!res.ok) {
        setStepError(
          safeUserFacingMessage(res.error, { fallback: 'Could not save availability.' }),
        );
        return;
      }
      await refetchOnboarding();
      await availabilityBoot.refetch();
      setStepIndex((i) => Math.min(STEP_COUNT - 1, i + 1));
      return;
    }

    if (stepIndex === 3) {
      const slug = sanitizeBusinessSlugForSave(linkSlugDraft);
      if (!slug) {
        setStepError('Choose a link for your booking page.');
        return;
      }
      setStepError('');
      setRemoteStepSaving(true);
      const res = await saveOnboardingStep4Slug({ slugRaw: linkSlugDraft });
      setRemoteStepSaving(false);
      if (!res.ok) {
        setStepError(safeUserFacingMessage(res.error, { fallback: 'Could not save link.' }));
        return;
      }
      await refetchOnboarding();
      await availabilityBoot.refetch();
      setStepIndex((i) => Math.min(STEP_COUNT - 1, i + 1));
      return;
    }

    // Step 5 activates the link from the trial card, not this handler.
    if (stepIndex >= STEP_COUNT - 1) {
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEP_COUNT - 1));
  };

  const onActivateLinkPress = useCallback(async () => {
    const token = session?.access_token ?? null;
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }
    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in again to continue.');
      return;
    }

    setCheckoutSubmitting(true);
    try {
      if (!ENABLE_ONBOARDING_STRIPE_TRIAL) {
        const serverComplete = await completeOnboardingV2(token);
        if ('error' in serverComplete) {
          let body = serverComplete.userMessage;
          if (__DEV__ && serverComplete.httpStatus === 404) {
            body +=
              '\n\nDev: add POST /api/onboarding-v2/complete on your web app (onboarding welcome email contract).';
          }
          if (__DEV__ && serverComplete.httpStatus === 0 && Constants.isDevice) {
            const tried = resolveStripeMobileCheckoutOrigin() ?? '(no origin)';
            body += `\n\nDev: could not reach your web API (${tried}). On a physical phone, set EXPO_PUBLIC_WEB_APP_URL to your computer's LAN IP (not localhost) and restart Expo.`;
          }
          Alert.alert('Could not activate your link', body);
          return;
        }
        // Cover the shell before profile refetch flips `needsOnboarding` — otherwise Home flashes for a frame.
        beginPostActivationHandoff();
        try {
          await refetchOnboarding();
          await queryClient.invalidateQueries({ queryKey: accountSettingsQueryKey(userId) });
          await queryClient.invalidateQueries({ queryKey: BOOKING_LINK_QUERY_KEY });
          await setPendingNavigateToBookingLink();
          const { completed } = await refetchOnboardingAfterStripe({
            userId,
            trial_confirmation: null,
            maxAttempts: 5,
            delayMs: 600,
          });
          if (!completed) {
            endPostActivationHandoff();
            await clearPendingBookingLinkNavigation();
            Alert.alert(
              'Almost there',
              'Your link is active. Pull to refresh on Home if the app has not updated yet.',
            );
          }
        } catch (syncError) {
          endPostActivationHandoff();
          await clearPendingBookingLinkNavigation();
          Alert.alert(
            'Almost there',
            safeUserFacingMessage(syncError, {
              fallback:
                'Your link is active, but we could not refresh the app. Pull to refresh on Home.',
            }),
          );
        }
        return;
      }

      const started = await startOnboardingTrial(token);

      if ('error' in started) {
        let body = safeUserFacingMessage(started.error, {
          fallback: 'Something went wrong. Try again.',
        });
        if (__DEV__ && started.httpStatus === 404) {
          body +=
            '\n\nDev: add POST /api/stripe/start-onboarding-trial on your web app (see docs/nextjs-onboarding-trial-contract.md).';
        }
        if (__DEV__ && started.httpStatus === 0 && Constants.isDevice) {
          const tried = resolveStripeMobileCheckoutOrigin() ?? '(no origin)';
          body += `\n\nDev: could not reach your web API (${tried}). On a physical phone, set EXPO_PUBLIC_WEB_APP_URL to your computer's LAN IP (not localhost) and restart Expo.`;
        }
        Alert.alert('Could not activate your link', body);
        return;
      }

      /** Server asks for Checkout + confirm (contract §C `fallbackToCheckout`). */
      if (started.fallbackToCheckout === true) {
        const checkout = await createOnboardingCheckoutSession(token);
        if ('error' in checkout) {
          Alert.alert(
            'Could not activate your link',
            safeUserFacingMessage(checkout.error, { fallback: 'Something went wrong. Try again.' }),
          );
          return;
        }
        const browser = await WebBrowser.openAuthSessionAsync(
          checkout.url,
          STRIPE_ONBOARDING_CHECKOUT_AUTH_RETURN_URL,
        );
        const sessionId =
          browser.type === 'success' && typeof browser.url === 'string'
            ? parseCheckoutSessionIdFromOnboardingReturnUrl(browser.url)
            : null;
        const confirmed = await confirmOnboardingTrialUntilReady({
          accessToken: token,
          userId,
          checkoutSessionId: sessionId,
        });
        if ('error' in confirmed) {
          Alert.alert(
            'Could not activate your link',
            safeUserFacingMessage(confirmed.error, {
              fallback: 'Something went wrong. Try again.',
            }),
          );
          return;
        }
        beginPostActivationHandoff();
        await queryClient.invalidateQueries({ queryKey: BOOKING_LINK_QUERY_KEY });
        await setPendingNavigateToBookingLink();
        const { completed } = await refetchOnboardingAfterStripe({
          userId,
          trial_confirmation: confirmed.trial_confirmation,
          maxAttempts: 5,
          delayMs: 600,
        });
        if (!completed) {
          endPostActivationHandoff();
          await clearPendingBookingLinkNavigation();
          Alert.alert('Almost there', 'Pull to refresh on Home in a moment.');
        }
        return;
      }

      beginPostActivationHandoff();
      await queryClient.invalidateQueries({ queryKey: BOOKING_LINK_QUERY_KEY });
      await setPendingNavigateToBookingLink();
      const { completed } = await refetchOnboardingAfterStripe({
        userId,
        trial_confirmation: started.trial_confirmation,
        maxAttempts: 5,
        delayMs: 600,
      });
      if (!completed) {
        endPostActivationHandoff();
        await clearPendingBookingLinkNavigation();
        Alert.alert('Almost there', 'Pull to refresh on Home in a moment.');
      }
    } catch (e) {
      endPostActivationHandoff();
      Alert.alert(
        'Could not activate your link',
        safeUserFacingMessage(e, { fallback: 'Something went wrong. Try again.' }),
      );
    } finally {
      setCheckoutSubmitting(false);
    }
  }, [
    session?.access_token,
    userId,
    refetchOnboarding,
    beginPostActivationHandoff,
    endPostActivationHandoff,
  ]);

  const goBack = () => {
    setStepError('');
    // Do not clamp to `onboardingStep` from the server: after a reload the profile step can be
    // ahead of the screen the user wants to review, and a server floor would trap Back (or move
    // forward). In-progress users may revisit any earlier step; Next still persists each step.
    setStepIndex((i) => Math.max(0, i - 1));
  };

  const onBusinessNameChange = (text) => {
    setBusinessName(text);
    if (stepError) {
      setStepError('');
    }
  };

  const onBusinessTypeChange = (value) => {
    setBusinessType(value);
    if (stepError) {
      setStepError('');
    }
  };

  const nextButtonLoading =
    (stepIndex === 0 && step1Submitting) ||
    ((stepIndex === 1 || stepIndex === 2 || stepIndex === 3) && remoteStepSaving);

  const nextDisabled = stepIndex === 1 && servicesList.length === 0;

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={styles.keyboard}
      >
        <View style={styles.stepperHeader}>
          <OnboardingProgressStepper currentIndex={stepIndex} totalSteps={STEP_COUNT} />
        </View>
        <View style={styles.mainBody}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.scroll}
          >
            {profileLoadError ? (
              <View style={styles.loadErrorBox}>
                <InlineCardError
                  message={safeUserFacingMessage(profileLoadError, {
                    fallback: 'Could not load your onboarding status.',
                  })}
                />
                <Button
                  style={styles.loadErrorRetry}
                  title="Try again"
                  variant="secondary"
                  onPress={() => refetchOnboarding()}
                />
              </View>
            ) : null}

            {stepIndex === 4 ? (
              <>
                <AppText style={[styles.title, styles.goLiveTitle]}>Go live</AppText>
                <AppText style={styles.subtitle}>
                  Your link goes live next.{' '}
                  <AppText style={styles.goLiveInlineEmph}>Share it. Get booked.</AppText>
                </AppText>
              </>
            ) : (
              <>
                <AppText style={styles.title}>{STEP_TITLES[stepIndex]}</AppText>
                {STEP_SUBTITLES[stepIndex] ? (
                  <AppText style={styles.subtitle}>{STEP_SUBTITLES[stepIndex]}</AppText>
                ) : null}
              </>
            )}
            {stepError ? (
              <View style={styles.stepErrorWrap}>
                <InlineCardError message={stepError} />
              </View>
            ) : null}

            {stepIndex === 0 ? (
              <View>
                <OnboardingBusinessStepCard
                  businessName={businessName}
                  businessType={businessType}
                  onBusinessNameChange={onBusinessNameChange}
                  onBusinessTypeChange={onBusinessTypeChange}
                />
                <AppText style={styles.businessTypeHint}>
                  The business type you choose affects which settings and options you see in the
                  app.
                </AppText>
              </View>
            ) : null}

            {stepIndex === 1 ? (
              <OnboardingServicesStep services={servicesList} onServicesChange={setServicesList} />
            ) : null}

            {stepIndex === 2 ? (
              <WeeklyScheduleSection
                dayEnabledMap={dayEnabledMap}
                dayTimeRanges={dayTimeRanges}
                style={{ marginBottom: 14 }}
                onDayTimeChange={(day, key, val) => {
                  setSchedulePreset('custom');
                  setDayTimeRanges((prev) => ({
                    ...prev,
                    [day]: { ...prev[day], [key]: val },
                  }));
                }}
                onDayToggle={(day, next) => {
                  setSchedulePreset('custom');
                  setDayEnabledMap((prev) => ({ ...prev, [day]: next }));
                }}
              />
            ) : null}

            {stepIndex === 3 ? (
              <OnboardingSlugStep value={linkSlugDraft} onChangeValue={setLinkSlugDraft} />
            ) : null}

            {stepIndex === 4 ? (
              <OnboardingTrialStep
                activateSubmitting={checkoutSubmitting}
                activationLink={getBookingLinkDisplay(linkSlugDraft)}
                onActivatePress={() => void onActivateLinkPress()}
              />
            ) : null}
          </ScrollView>
          <View style={styles.actionsBar}>
            {stepIndex === 4 ? (
              <Button fullWidth title="Back" variant="secondary" onPress={goBack} />
            ) : stepIndex > 0 ? (
              <View style={styles.row}>
                <Button
                  fullWidth
                  onPress={goBack}
                  style={styles.flex}
                  title="Back"
                  variant="secondary"
                />
                <Button
                  disabled={nextDisabled}
                  fullWidth
                  loading={nextButtonLoading}
                  onPress={() => void goNext()}
                  style={styles.flex}
                  title="Next"
                />
              </View>
            ) : (
              <Button
                disabled={nextDisabled}
                fullWidth
                loading={nextButtonLoading}
                onPress={() => void goNext()}
                title="Next"
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
