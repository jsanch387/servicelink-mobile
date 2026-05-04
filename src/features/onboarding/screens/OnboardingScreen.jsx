import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { BUSINESS_TYPE_OPTIONS } from '../../../constants/businessTypeOptions';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { useBusinessAvailability } from '../../availability/hooks/useBusinessAvailability';
import { buildAvailabilityUiFromPreset } from '../../availability/utils/availabilityModel';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { getBookingLinkDisplay } from '../../home/utils/bookingLink';
import { sanitizeBusinessSlugForSave } from '../../more/utils/businessSlug';
import { fetchBusinessServices } from '../../services/api/services';
import {
  saveOnboardingStep1,
  saveOnboardingStep2Services,
  saveOnboardingStep3Availability,
  saveOnboardingStep4Slug,
} from '../api/onboardingV2Api';
import { WeeklyScheduleSection } from '../../availability/components/WeeklyScheduleSection';
import { OnboardingBusinessStepCard } from '../components/OnboardingBusinessStepCard';
import { OnboardingProgressStepper } from '../components/OnboardingProgressStepper';
import { OnboardingServicesStep } from '../components/OnboardingServicesStep';
import { OnboardingSlugStep } from '../components/OnboardingSlugStep';
import { OnboardingTrialStep } from '../components/OnboardingTrialStep';
import { useOnboardingGate } from '../context/OnboardingGateContext';

const STEP_COUNT = 5;

const STEP_TITLES = [
  'Your business',
  'Add at least one service',
  'When do you work?',
  'Choose your link',
  'Go live',
];

const STEP_SUBTITLES = [
  'Add the name customers see and the category that best fits you.',
  'Add one service to continue — you can add the rest after onboarding.',
  'Pick your usual hours. Customers will only see times when you are free.',
  'This is the link you will share with customers. Pick something short and easy to remember.',
  'Your booking link is ready.',
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
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const {
    completeOnboarding,
    refetchOnboarding,
    onboardingStep,
    isOnboardingProfileLoaded,
    profileLoadError,
  } = useOnboardingGate();
  const [stepIndex, setStepIndex] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [stepError, setStepError] = useState('');
  const [step1Submitting, setStep1Submitting] = useState(false);
  const [finishSubmitting, setFinishSubmitting] = useState(false);
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

  const isLast = stepIndex === STEP_COUNT - 1;

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
          paddingBottom: 28,
          paddingHorizontal: 16,
          paddingTop: 0,
        },
        loadErrorBox: {
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          marginBottom: 16,
          padding: 16,
        },
        loadErrorText: {
          color: colors.danger,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 12,
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
        goLiveHeadline: {
          color: colors.text,
          fontSize: 28,
          fontWeight: '800',
          letterSpacing: 0.5,
          marginBottom: 8,
          textAlign: 'left',
        },
        goLiveSublineRow: {
          alignItems: 'center',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          marginBottom: 20,
        },
        goLiveReadyPart: {
          color: colors.textMuted,
          flexShrink: 1,
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 22,
        },
        goLiveNoCardPart: {
          color: colors.text,
          flexShrink: 0,
          fontSize: 16,
          fontWeight: '700',
          lineHeight: 22,
        },
        copy: {
          color: colors.textMuted,
          fontSize: 16,
          lineHeight: 24,
          textAlign: 'left',
        },
        stepError: {
          color: colors.danger,
          fontSize: 14,
          marginBottom: 12,
          textAlign: 'left',
        },
        actions: {
          gap: 12,
          marginTop: 24,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        flex: {
          flex: 1,
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
        setStepError(res.error?.message ?? 'Could not save. Try again.');
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
        setStepError(res.error?.message ?? 'Could not save services.');
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
        setStepError(res.error?.message ?? 'Could not save availability.');
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
        setStepError(res.error?.message ?? 'Could not save link.');
        return;
      }
      await refetchOnboarding();
      await availabilityBoot.refetch();
      setStepIndex((i) => Math.min(STEP_COUNT - 1, i + 1));
      return;
    }

    if (isLast) {
      setFinishSubmitting(true);
      const result = await completeOnboarding();
      setFinishSubmitting(false);
      if (!result.ok) {
        Alert.alert(
          'Could not finish onboarding',
          result.error?.message ?? 'Something went wrong. You can try again from settings later.',
        );
      }
      return;
    }
    setStepIndex((i) => Math.min(i + 1, STEP_COUNT - 1));
  };

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
    ((stepIndex === 1 || stepIndex === 2 || stepIndex === 3) && remoteStepSaving) ||
    (isLast && finishSubmitting);

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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {profileLoadError ? (
            <View style={styles.loadErrorBox}>
              <AppText style={styles.loadErrorText}>
                {String(profileLoadError?.message ?? 'Could not load your onboarding status.')}
              </AppText>
              <Button onPress={() => refetchOnboarding()} title="Try again" variant="secondary" />
            </View>
          ) : null}

          {stepIndex === 4 ? (
            <>
              <AppText style={styles.goLiveHeadline}>GO LIVE!</AppText>
              <View style={styles.goLiveSublineRow}>
                <AppText style={styles.goLiveReadyPart} numberOfLines={1}>
                  Your booking link is ready.{' '}
                </AppText>
                <AppText style={styles.goLiveNoCardPart} numberOfLines={1}>
                  No card required.
                </AppText>
              </View>
            </>
          ) : (
            <>
              <AppText style={styles.title}>{STEP_TITLES[stepIndex]}</AppText>
              <AppText style={styles.subtitle}>{STEP_SUBTITLES[stepIndex]}</AppText>
            </>
          )}
          {stepError ? <AppText style={styles.stepError}>{stepError}</AppText> : null}

          {stepIndex === 0 ? (
            <OnboardingBusinessStepCard
              businessName={businessName}
              businessType={businessType}
              onBusinessNameChange={onBusinessNameChange}
              onBusinessTypeChange={onBusinessTypeChange}
            />
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
            <OnboardingTrialStep activationLink={getBookingLinkDisplay(linkSlugDraft)} />
          ) : null}

          <View style={styles.actions}>
            {stepIndex > 0 ? (
              <View style={styles.row}>
                <Button
                  fullWidth
                  onPress={goBack}
                  style={styles.flex}
                  title="Back"
                  variant="secondary"
                />
                <Button
                  fullWidth
                  loading={nextButtonLoading}
                  onPress={() => void goNext()}
                  style={styles.flex}
                  title={isLast ? 'Finish' : 'Next'}
                />
              </View>
            ) : (
              <Button
                fullWidth
                loading={nextButtonLoading}
                onPress={() => void goNext()}
                title={isLast ? 'Finish' : 'Next'}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
