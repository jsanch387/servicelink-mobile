import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, InlineCardError, WizardStepHeader } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useTheme } from '../../../theme';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { localYyyyMmDd } from '../../home/utils/bookingStart';
import { formatPhoneForDisplay } from '../../../utils/phone';
import { safeUserFacingMessage } from '../../../utils/safeUserFacingMessage';
import { isValidCalendarYyyyMmDd } from '../utils/formatScheduledDateDisplay';
import { CreateQuoteSendSuccess } from '../components/create-quote/CreateQuoteSendSuccess';
import { CreateQuoteStepContent } from '../components/create-quote/CreateQuoteStepContent';
import { CreateQuoteSubmittingState } from '../components/create-quote/CreateQuoteSubmittingState';
import { CreateQuoteWizardFooter } from '../components/create-quote/CreateQuoteWizardFooter';
import {
  CREATE_QUOTE_CATALOG_PICK_COPY,
  CREATE_QUOTE_CUSTOM_DETAILS_COPY,
  CREATE_QUOTE_CUSTOM_JOB_ID,
  CREATE_QUOTE_PRICING_DETAILS_COPY,
  CREATE_QUOTE_STEP,
  CREATE_QUOTE_WIZARD_STEPS,
} from '../constants/createQuoteWizard';
import { postSendExistingQuote, postSendNewQuote } from '../api/sendQuote';
import { useCreateQuoteServiceCatalog } from '../hooks/useCreateQuoteServiceCatalog';
import { quoteDetailQueryKey, quotesListQueryKey } from '../queryKeys';
import {
  deriveCatalogQuoteFields,
  isCreateQuoteCustomJobSelection,
} from '../utils/createQuoteCatalogSelection';
import {
  getCreateQuoteWizardStepCount,
  getCreateQuoteWizardStepIndex,
  getNextCreateQuoteStepOnContinue,
  getPreviousCreateQuoteStepOnBack,
  isCreateQuoteAddonsStepSkipped,
  isCreateQuoteDetailsStepSkipped,
} from '../utils/createQuoteFlowNavigation';
import { canAdvanceCreateQuoteStep } from '../utils/createQuoteStepGuards';
import {
  dbTimeToCreateQuoteTime12hSnapped,
  twelveHourDisplayToHhMm,
  validateSendQuotePayload,
} from '../utils/validateSendQuotePayload';

/**
 * Path A: new quote — `POST /api/quotes/send`.
 * Path B: existing request/draft — `POST /api/quotes/[id]/send` when `quoteRequestId` is set.
 *
 * Params (from quote request): `quoteRequestId`, `customerName`, `customerEmail`, `customerPhone`,
 * `vehicleYear`, `vehicleMake`, `vehicleModel`, `serviceName`, `customerRequestNotes` (read-only on
 * review), `scheduledDateYyyyMmDd`, `scheduledStartTime12h`. Cold start from Home omits params.
 */
export function CreateQuoteScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { session, user } = useAuth();
  const scrollRef = useRef(null);
  const userId = user?.id;
  const accessToken = session?.access_token;

  const handleBusinessNoteFocus = useCallback(() => {
    const scrollToNote = () => scrollRef.current?.scrollToEnd({ animated: true });
    scrollToNote();
    requestAnimationFrame(scrollToNote);
  }, []);

  const quoteRequestIdRaw = route.params?.quoteRequestId;
  const quoteRequestId =
    quoteRequestIdRaw === undefined || quoteRequestIdRaw === null
      ? undefined
      : String(quoteRequestIdRaw).trim() || undefined;

  const prefName = String(route.params?.customerName ?? '').trim();
  const prefEmail = String(route.params?.customerEmail ?? '').trim();
  const prefPhone = String(route.params?.customerPhone ?? '').trim();
  const prefVehicleYear = String(route.params?.vehicleYear ?? '').trim();
  const prefVehicleMake = String(route.params?.vehicleMake ?? '').trim();
  const prefVehicleModel = String(route.params?.vehicleModel ?? '').trim();
  const prefServiceName = String(route.params?.serviceName ?? '').trim();
  const customerRequestNotes = String(
    route.params?.customerRequestNotes ?? route.params?.requestNote ?? '',
  ).trim();
  const prefScheduledDate = String(route.params?.scheduledDateYyyyMmDd ?? '').trim();
  const prefScheduledTimeRaw = String(route.params?.scheduledStartTime12h ?? '').trim();
  const prefScheduledTime =
    prefScheduledTimeRaw && twelveHourDisplayToHhMm(prefScheduledTimeRaw)
      ? prefScheduledTimeRaw
      : dbTimeToCreateQuoteTime12hSnapped(prefScheduledTimeRaw);

  const [stepIndex, setStepIndex] = useState(CREATE_QUOTE_STEP.CUSTOMER);
  const [customerName, setCustomerName] = useState(() => prefName || '');
  const [customerEmail, setCustomerEmail] = useState(() => prefEmail || '');
  const [customerPhoneDisplay, setCustomerPhoneDisplay] = useState(() =>
    prefPhone ? formatPhoneForDisplay(prefPhone) || prefPhone : '',
  );
  const [vehicleYear, setVehicleYear] = useState(() => prefVehicleYear || '');
  const [vehicleMake, setVehicleMake] = useState(() => prefVehicleMake || '');
  const [vehicleModel, setVehicleModel] = useState(() => prefVehicleModel || '');
  /** UI-only selection; catalog IDs come from mock until real services are wired. */
  const [selectedServiceId, setSelectedServiceId] = useState(
    /** @type {string | null} */ (() => (prefServiceName ? CREATE_QUOTE_CUSTOM_JOB_ID : null)),
  );
  /** Path gate on the service step: chooser vs catalog list. */
  const [servicePickPhase, setServicePickPhase] = useState(
    /** @type {'chooser' | 'catalog'} */ ('chooser'),
  );
  const [selectedPricingId, setSelectedPricingId] = useState(/** @type {string | null} */ (null));
  const [selectedAddonIds, setSelectedAddonIds] = useState(/** @type {string[]} */ ([]));
  const [serviceName, setServiceName] = useState(() => prefServiceName || '');
  const [priceUsdText, setPriceUsdText] = useState('');
  const [durationHhMm, setDurationHhMm] = useState('01:00');
  const [businessNote, setBusinessNote] = useState('');
  const [scheduleMode, setScheduleMode] = useState(
    /** @type {'unset' | 'pick' | 'customer'} */ (
      prefScheduledDate && isValidCalendarYyyyMmDd(prefScheduledDate) ? 'pick' : 'unset'
    ),
  );
  const [scheduledDateYyyyMmDd, setScheduledDateYyyyMmDd] = useState(() =>
    prefScheduledDate && isValidCalendarYyyyMmDd(prefScheduledDate)
      ? prefScheduledDate
      : localYyyyMmDd(),
  );
  const [scheduledStartTime12h, setScheduledStartTime12h] = useState(() =>
    prefScheduledTime && twelveHourDisplayToHhMm(prefScheduledTime) ? prefScheduledTime : '9:00 AM',
  );

  const [sendError, setSendError] = useState(/** @type {string | null} */ (null));
  const [sending, setSending] = useState(false);
  const [sendSucceeded, setSendSucceeded] = useState(false);

  const isCustomJob = isCreateQuoteCustomJobSelection(selectedServiceId);

  const quoteCatalog = useCreateQuoteServiceCatalog({
    userId,
    selectedServiceId,
    isCustomJob,
  });

  const {
    catalogServices,
    catalogCategories,
    catalogLoading,
    catalogError,
    selectedCatalogService,
    pricingOptions,
    priceOptionsLoading,
    addonsForSelectedService,
  } = quoteCatalog;

  const selectedPricingOption = useMemo(() => {
    if (!selectedPricingId) return null;
    return pricingOptions.find((o) => String(o.id) === String(selectedPricingId)) ?? null;
  }, [pricingOptions, selectedPricingId]);

  const pricingOptionsCount = pricingOptions.length;
  const addonsCount = addonsForSelectedService.length;

  const detailsSkipped = isCreateQuoteDetailsStepSkipped({
    isCustomJob,
    pricingOptionsCount,
    priceOptionsLoading,
  });
  const addonsSkipped = isCreateQuoteAddonsStepSkipped({
    isCustomJob,
    addonsCount,
  });

  const selectedAddonRows = useMemo(() => {
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    return addonsForSelectedService.filter((a) => idSet.has(String(a.id)));
  }, [addonsForSelectedService, selectedAddonIds]);

  const catalogDerived = useMemo(() => {
    if (!selectedCatalogService) return null;
    return deriveCatalogQuoteFields(
      selectedCatalogService,
      selectedPricingOption,
      selectedAddonRows,
    );
  }, [selectedAddonRows, selectedCatalogService, selectedPricingOption]);

  useEffect(() => {
    if (isCustomJob || !catalogDerived) return;
    setServiceName(catalogDerived.serviceName);
    setPriceUsdText(catalogDerived.priceUsdText);
    setDurationHhMm(catalogDerived.durationHhMm);
  }, [catalogDerived, isCustomJob]);

  useEffect(() => {
    if (!selectedPricingId) return;
    if (!pricingOptions.length) return;
    if (!pricingOptions.some((o) => o.id === selectedPricingId)) {
      setSelectedPricingId(null);
    }
  }, [pricingOptions, selectedPricingId]);

  useEffect(() => {
    if (pricingOptions.length !== 1 || selectedPricingId) return;
    if (priceOptionsLoading) return;
    setSelectedPricingId(pricingOptions[0].id);
  }, [priceOptionsLoading, pricingOptions, selectedPricingId]);

  const handleChooseYourServices = useCallback(() => {
    setServicePickPhase('catalog');
    setSelectedServiceId(null);
    setSelectedPricingId(null);
    setSelectedAddonIds([]);
    setServiceName(prefServiceName || '');
    setPriceUsdText('');
    setDurationHhMm('01:00');
  }, [prefServiceName]);

  const handleChooseCustomJob = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    setSelectedServiceId(CREATE_QUOTE_CUSTOM_JOB_ID);
    setSelectedPricingId(null);
    setSelectedAddonIds([]);
    setServicePickPhase('chooser');
    if (!prefServiceName) {
      setServiceName('');
      setPriceUsdText('');
      setDurationHhMm('01:00');
    } else {
      setServiceName(prefServiceName);
    }
    setStepIndex(CREATE_QUOTE_STEP.DETAILS);
  }, [prefServiceName]);

  const handleSelectCatalogService = useCallback((id) => {
    const nextId = String(id ?? '');
    if (!nextId) return;
    setSelectedServiceId(nextId);
    setSelectedPricingId(null);
    setSelectedAddonIds([]);
    setServicePickPhase('catalog');
  }, []);

  const handleToggleAddon = useCallback((addonId) => {
    const id = String(addonId);
    setSelectedAddonIds((prev) =>
      prev.some((x) => String(x) === id) ? prev.filter((x) => String(x) !== id) : [...prev, id],
    );
  }, []);

  const handleChooseScheduleDate = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    setScheduleMode('pick');
    if (!isValidCalendarYyyyMmDd(scheduledDateYyyyMmDd)) {
      setScheduledDateYyyyMmDd(localYyyyMmDd());
    }
    setStepIndex(CREATE_QUOTE_STEP.SCHEDULE_PICK);
  }, [scheduledDateYyyyMmDd]);

  const handleLetCustomerChooseSchedule = useCallback(() => {
    void Haptics.selectionAsync().catch(() => {});
    setScheduleMode('customer');
    setStepIndex(CREATE_QUOTE_STEP.REVIEW);
  }, []);

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) {
        throw new Error(error.message ?? 'Could not load business');
      }
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });

  const business = businessQ.data ?? null;
  const businessId = business?.id;
  const businessSlug = String(business?.business_slug ?? '').trim();

  const schedulePickIncluded = scheduleMode === 'pick';
  const skipArgs = useMemo(
    () => ({ detailsSkipped, addonsSkipped, schedulePickIncluded }),
    [addonsSkipped, detailsSkipped, schedulePickIncluded],
  );
  const lastStepIndex = CREATE_QUOTE_STEP.REVIEW;
  const visibleStepCount = getCreateQuoteWizardStepCount(skipArgs);
  const visibleStepIndex = getCreateQuoteWizardStepIndex(stepIndex, skipArgs);

  const stepDef = useMemo(() => {
    const base = CREATE_QUOTE_WIZARD_STEPS[stepIndex] ?? CREATE_QUOTE_WIZARD_STEPS[0];
    if (stepIndex === CREATE_QUOTE_STEP.SERVICE && servicePickPhase === 'catalog') {
      return { ...base, ...CREATE_QUOTE_CATALOG_PICK_COPY };
    }
    if (stepIndex !== CREATE_QUOTE_STEP.DETAILS) return base;
    if (isCustomJob) {
      return { ...base, ...CREATE_QUOTE_CUSTOM_DETAILS_COPY };
    }
    return { ...base, ...CREATE_QUOTE_PRICING_DETAILS_COPY };
  }, [isCustomJob, servicePickPhase, stepIndex]);

  const formSnapshot = useMemo(
    () => ({
      customerName,
      customerEmail,
      customerPhoneDisplay,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      selectedServiceId,
      isCustomJob,
      selectedPricingId,
      pricingOptionsCount,
      priceOptionsLoading,
      serviceName,
      priceUsdText,
      durationHhMm,
      scheduleMode,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
    }),
    [
      customerEmail,
      customerName,
      customerPhoneDisplay,
      durationHhMm,
      isCustomJob,
      priceOptionsLoading,
      priceUsdText,
      pricingOptionsCount,
      scheduleMode,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
      selectedPricingId,
      selectedServiceId,
      serviceName,
      vehicleMake,
      vehicleModel,
      vehicleYear,
    ],
  );

  const canContinue = canAdvanceCreateQuoteStep(stepIndex, formSnapshot);

  const formBag = useMemo(
    () => ({
      customerName,
      setCustomerName,
      customerEmail,
      setCustomerEmail,
      customerPhoneDisplay,
      setCustomerPhoneDisplay,
      vehicleYear,
      setVehicleYear,
      vehicleMake,
      setVehicleMake,
      vehicleModel,
      setVehicleModel,
      catalogServices,
      catalogCategories,
      catalogLoading,
      catalogError,
      servicePickPhase,
      selectedServiceId,
      onChooseYourServices: handleChooseYourServices,
      onChooseCustomJob: handleChooseCustomJob,
      onSelectCatalogService: handleSelectCatalogService,
      isCustomJob,
      selectedCatalogService,
      pricingOptions,
      selectedPricingId,
      setSelectedPricingId,
      selectedPricingOption,
      selectedAddonIds,
      addonsForSelectedService,
      onToggleAddon: handleToggleAddon,
      serviceName,
      setServiceName,
      priceUsdText,
      setPriceUsdText,
      durationHhMm,
      setDurationHhMm,
      pricingOptionLabel: catalogDerived?.pricingOptionLabel ?? null,
      addonLines: catalogDerived?.selectedAddons ?? null,
      scheduleMode,
      onChooseScheduleDate: handleChooseScheduleDate,
      onLetCustomerChooseSchedule: handleLetCustomerChooseSchedule,
      scheduledDateYyyyMmDd,
      setScheduledDateYyyyMmDd,
      scheduledStartTime12h,
      setScheduledStartTime12h,
      businessNote,
      setBusinessNote,
      onBusinessNoteFocus: handleBusinessNoteFocus,
      customerRequestNotes,
    }),
    [
      addonsForSelectedService,
      businessNote,
      catalogCategories,
      catalogDerived,
      catalogError,
      catalogLoading,
      catalogServices,
      customerEmail,
      customerName,
      customerPhoneDisplay,
      customerRequestNotes,
      durationHhMm,
      handleChooseCustomJob,
      handleChooseScheduleDate,
      handleChooseYourServices,
      handleBusinessNoteFocus,
      handleLetCustomerChooseSchedule,
      handleSelectCatalogService,
      handleToggleAddon,
      isCustomJob,
      priceUsdText,
      pricingOptions,
      scheduleMode,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
      selectedAddonIds,
      selectedCatalogService,
      selectedPricingId,
      selectedPricingOption,
      selectedServiceId,
      serviceName,
      servicePickPhase,
      vehicleMake,
      vehicleModel,
      vehicleYear,
    ],
  );

  const isReviewStep = stepIndex === lastStepIndex;
  const showSubmitPanel = isReviewStep && !sendSucceeded && (sending || Boolean(sendError));
  const hideNavigationHeader = showSubmitPanel || sendSucceeded;

  useLayoutEffect(() => {
    navigation.setOptions({
      gestureEnabled: !hideNavigationHeader,
      headerShown: !hideNavigationHeader,
      title: isReviewStep ? 'Review' : quoteRequestId ? 'Send quote' : 'New quote',
    });
  }, [hideNavigationHeader, isReviewStep, navigation, quoteRequestId]);

  useLayoutEffect(
    () => () => {
      navigation.setOptions({ gestureEnabled: true, headerShown: true });
    },
    [navigation],
  );

  const handleSuccessDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleBackToReview = useCallback(() => {
    setSendError(null);
  }, []);

  const handleSend = useCallback(async () => {
    setSendError(null);
    setSendSucceeded(false);
    if (!accessToken) {
      setSendError('Sign in to send quotes.');
      return;
    }
    if (!businessSlug) {
      setSendError('Your public business slug is missing. Add it on the web app, then try again.');
      return;
    }

    const quoteServiceName =
      !isCustomJob && catalogDerived ? catalogDerived.serviceName : serviceName;
    const quotePriceUsdText =
      !isCustomJob && catalogDerived ? catalogDerived.priceUsdText : priceUsdText;
    const quoteDurationHhMm =
      !isCustomJob && catalogDerived ? catalogDerived.durationHhMm : durationHhMm;

    const validated = validateSendQuotePayload({
      businessSlug,
      customerName,
      customerEmail,
      customerPhoneDisplay,
      vehicleYear,
      vehicleMake,
      vehicleModel,
      serviceName: quoteServiceName,
      priceUsdText: quotePriceUsdText,
      durationHhMm: quoteDurationHhMm,
      serviceId: !isCustomJob ? catalogDerived?.serviceId : null,
      servicePriceOptionId: !isCustomJob ? catalogDerived?.servicePriceOptionId : null,
      servicePriceCents: !isCustomJob ? catalogDerived?.servicePriceCents : null,
      totalDurationMinutes: !isCustomJob ? catalogDerived?.totalDurationMinutes : null,
      addonDetails: !isCustomJob ? catalogDerived?.addonDetails : null,
      note: businessNote,
      scheduleMode,
      scheduledDateYyyyMmDd,
      scheduledStartTime12h,
    });

    if (!validated.ok) {
      setSendError(validated.message);
      return;
    }

    setSending(true);
    try {
      const result = quoteRequestId
        ? await postSendExistingQuote(accessToken, quoteRequestId, validated.body)
        : await postSendNewQuote(accessToken, validated.body);

      if (!result.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        setSendError(
          safeUserFacingMessage(result.error, {
            fallback: 'Could not send quote. Please try again.',
          }),
        );
        return;
      }

      if (businessId) {
        await queryClient.invalidateQueries({ queryKey: quotesListQueryKey(businessId) });
        if (quoteRequestId) {
          await queryClient.invalidateQueries({
            queryKey: quoteDetailQueryKey(businessId, quoteRequestId),
          });
        }
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSendSucceeded(true);
    } finally {
      setSending(false);
    }
  }, [
    accessToken,
    businessId,
    businessSlug,
    catalogDerived,
    customerEmail,
    customerName,
    customerPhoneDisplay,
    durationHhMm,
    isCustomJob,
    businessNote,
    priceUsdText,
    queryClient,
    quoteRequestId,
    scheduleMode,
    scheduledDateYyyyMmDd,
    scheduledStartTime12h,
    serviceName,
    vehicleMake,
    vehicleModel,
    vehicleYear,
  ]);

  const handleFooterBack = useCallback(() => {
    setSendError(null);

    if (stepIndex === CREATE_QUOTE_STEP.CUSTOMER) {
      navigation.goBack();
      return;
    }

    if (stepIndex === CREATE_QUOTE_STEP.SERVICE && servicePickPhase === 'catalog') {
      setServicePickPhase('chooser');
      setSelectedServiceId(null);
      setSelectedPricingId(null);
      setSelectedAddonIds([]);
      setServiceName(prefServiceName || '');
      setPriceUsdText('');
      setDurationHhMm('01:00');
      return;
    }

    if (stepIndex === CREATE_QUOTE_STEP.DETAILS && isCustomJob) {
      setStepIndex(CREATE_QUOTE_STEP.SERVICE);
      setServicePickPhase('chooser');
      setSelectedServiceId(null);
      setServiceName(prefServiceName || '');
      setPriceUsdText('');
      setDurationHhMm('01:00');
      return;
    }

    if (stepIndex === CREATE_QUOTE_STEP.SCHEDULE_PICK) {
      setScheduleMode('unset');
      setStepIndex(CREATE_QUOTE_STEP.SCHEDULE);
      return;
    }

    if (stepIndex === CREATE_QUOTE_STEP.REVIEW) {
      const prev = getPreviousCreateQuoteStepOnBack({
        step: stepIndex,
        detailsSkipped,
        addonsSkipped,
        schedulePickIncluded,
      });
      setStepIndex(prev);
      if (prev === CREATE_QUOTE_STEP.SCHEDULE) {
        setScheduleMode('unset');
      }
      return;
    }

    if (
      stepIndex === CREATE_QUOTE_STEP.DETAILS ||
      stepIndex === CREATE_QUOTE_STEP.ADDONS ||
      stepIndex === CREATE_QUOTE_STEP.SCHEDULE
    ) {
      const prev = getPreviousCreateQuoteStepOnBack({
        step: stepIndex,
        detailsSkipped,
        addonsSkipped,
        schedulePickIncluded,
      });
      setStepIndex(prev);
      if (prev === CREATE_QUOTE_STEP.SERVICE) {
        setServicePickPhase(isCustomJob ? 'chooser' : 'catalog');
      }
      return;
    }

    setStepIndex(
      getPreviousCreateQuoteStepOnBack({
        step: stepIndex,
        detailsSkipped,
        addonsSkipped,
        schedulePickIncluded,
      }),
    );
  }, [
    addonsSkipped,
    detailsSkipped,
    isCustomJob,
    navigation,
    prefServiceName,
    schedulePickIncluded,
    servicePickPhase,
    stepIndex,
  ]);

  const handleFooterContinue = useCallback(() => {
    setSendError(null);
    if (stepIndex >= lastStepIndex) {
      void handleSend();
      return;
    }
    void Haptics.selectionAsync().catch(() => {});
    setStepIndex(
      getNextCreateQuoteStepOnContinue({
        step: stepIndex,
        detailsSkipped,
        addonsSkipped,
        schedulePickIncluded,
      }),
    );
  }, [addonsSkipped, detailsSkipped, handleSend, lastStepIndex, schedulePickIncluded, stepIndex]);

  const sendButtonTitle = 'Send quote';

  const businessLoadRefreshControl = useMemo(
    () => (
      <RefreshControl
        colors={[colors.accent]}
        onRefresh={() => void businessQ.refetch()}
        refreshing={Boolean(businessQ.isFetching && !businessQ.isLoading)}
        tintColor={colors.accent}
      />
    ),
    [businessQ, colors.accent],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
        },
        flex: {
          flex: 1,
          minHeight: 0,
          width: '100%',
        },
        scroll: {
          flex: 1,
        },
        column: {
          flex: 1,
          minHeight: 0,
          width: '100%',
        },
        scrollOuter: {
          flex: 1,
          minHeight: 0,
          width: '100%',
        },
        content: {
          flexGrow: 1,
          gap: 16,
          paddingBottom: 28,
          paddingHorizontal: SCREEN_GUTTER,
          paddingTop: 6,
        },
        contentReview: {
          gap: 12,
          paddingBottom: 36,
          paddingTop: 22,
        },
        contentSuccessConfirm: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingBottom: 40,
          paddingTop: 32,
          width: '100%',
        },
        loadingBox: {
          alignItems: 'center',
          paddingVertical: 24,
        },
        businessErrorRetry: {
          marginTop: 12,
        },
      }),
    [colors],
  );

  if (businessQ.isLoading) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.loadingBox}
          refreshControl={businessLoadRefreshControl}
          style={styles.scroll}
        >
          <ActivityIndicator color={colors.textMuted} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (businessQ.isError) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.root}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={businessLoadRefreshControl}
          style={styles.scroll}
        >
          <InlineCardError message={businessQ.error?.message ?? 'Could not load your business.'} />
          <Button
            accessibilityHint="Attempts to load your business again"
            accessibilityLabel="Try again"
            fullWidth
            loading={Boolean(businessQ.isFetching && !businessQ.isLoading)}
            style={styles.businessErrorRetry}
            title="Try again"
            variant="secondary"
            onPress={() => void businessQ.refetch()}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <>
      <View style={styles.root}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <View style={styles.column}>
            {!isReviewStep ? (
              <WizardStepHeader
                progressAccessibilityLabel="Quote wizard progress"
                stepCount={visibleStepCount}
                stepIndex={visibleStepIndex}
                subtitle={stepDef.subtitle}
                title={stepDef.title}
              />
            ) : null}

            <View style={styles.scrollOuter}>
              <ScrollView
                ref={scrollRef}
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                contentContainerStyle={[
                  styles.content,
                  isReviewStep && !sendSucceeded && styles.contentReview,
                  sendSucceeded && styles.contentSuccessConfirm,
                ]}
                keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.scroll}
              >
                {!businessSlug ? (
                  <InlineCardError message="Your business slug is not set. Finish your booking profile on the web app, then return here." />
                ) : null}

                {sendSucceeded ? (
                  <CreateQuoteSendSuccess customerEmail={customerEmail} />
                ) : (
                  <CreateQuoteStepContent form={formBag} stepIndex={stepIndex} />
                )}
              </ScrollView>
            </View>

            {!showSubmitPanel ? (
              <CreateQuoteWizardFooter
                canContinue={canContinue}
                disabled={!businessSlug || !accessToken}
                lastStepIndex={lastStepIndex}
                paddingBottom={12 + insets.bottom}
                sendButtonTitle={sendButtonTitle}
                sendSuccessMode={sendSucceeded}
                sending={sending}
                stepIndex={stepIndex}
                onBack={handleFooterBack}
                onContinue={handleFooterContinue}
                onSuccessDone={handleSuccessDone}
              />
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </View>

      <Modal
        animationType="fade"
        presentationStyle="fullScreen"
        statusBarTranslucent
        visible={showSubmitPanel}
        onRequestClose={() => {}}
      >
        <SafeAreaView
          edges={['top', 'bottom', 'left', 'right']}
          style={{ backgroundColor: colors.shell, flex: 1 }}
        >
          <CreateQuoteSubmittingState error={sendError} onBackToReview={handleBackToReview} />
        </SafeAreaView>
      </Modal>
    </>
  );
}
