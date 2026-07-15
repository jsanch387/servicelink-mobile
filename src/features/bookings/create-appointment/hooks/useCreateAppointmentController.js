import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { useToast } from '../../../../components/ui';
import { customersListQueryKey } from '../../../customers/queryKeys';
import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import { postOwnerManualPublicBooking } from '../api/postOwnerManualPublicBooking';
import {
  CREATE_APPOINTMENT_CUSTOM_JOB_ID,
  CREATE_APPOINTMENT_LAST_STEP,
  CREATE_APPOINTMENT_STEP,
  CREATE_APPOINTMENT_STEP_META,
  createEmptyAddressForm,
  createEmptyCustomerForm,
  createEmptyVehicleForm,
} from '../constants';
import { serviceDurationHHmmToMinutes } from '../../../../components/ui/durationTime';
import {
  isAddressStepComplete,
  parseRequiredCustomJobPriceCents,
} from '../utils/createAppointmentValidators';
import { buildOwnerManualPublicBookingBody } from '../utils/buildOwnerBookingPayload';
import {
  buildAppliedSaleDiscount,
  pickActiveSaleForAppointmentDate,
} from '../utils/applyOwnerBookingSale';
import { parsePriceLabelToUsd } from '../utils/priceLabelMath';
import {
  CREATE_APPOINTMENT_LOCATION_MOBILE,
  CREATE_APPOINTMENT_LOCATION_SHOP,
  addressFormFromBusinessShopLocation,
  getCreateAppointmentAddressStepCopy,
  getDefaultAppointmentLocationType,
  isCreateAppointmentAddressStepSkipped,
  isCreateAppointmentLocationStepSkipped,
} from '../utils/createAppointmentServiceLocation';
import { invalidateBookingCachesAfterMutation } from '../../booking-details/utils/invalidateBookingCachesAfterMutation';
import { canContinueCreateAppointmentStep } from '../utils/createFlowContinueGate';
import {
  baseServiceDurationMinutes,
  totalBookingDurationMinutes,
} from '../utils/createFlowDuration';
import {
  getCreateAppointmentWizardStepCount,
  getCreateAppointmentWizardStepIndex,
  getNextStepOnContinue,
  getPreviousStepOnBack,
  isAddonsStepSkipped,
} from '../utils/createFlowNavigation';
import {
  buildCreateFlowPricingOptions,
  getSelectedCreateFlowPricingOption,
  isServicePriceTiersEnabled,
  shouldSkipCreateFlowPricingStep,
} from '../utils/createFlowPricing';
import { useBookingCalendar } from '../../../availability/booking';
import { isSelectedScheduleStillValid } from '../../../availability/booking/utils/bookingCalendar';
import { parseScheduleInputs } from '../../../availability/booking/utils/scheduleInputs';
import { createAppointmentFlowStyles } from '../styles/createAppointmentFlowStyles';
import { showAppointmentConfirmationSmsToast } from '../utils/appointmentConfirmationSmsToast';
import { resolveCreateAppointmentWizardHeader } from '../utils/resolveCreateAppointmentWizardHeader';
import { useCreateAppointmentServerData } from './useCreateAppointmentServerData';
import { useCreateAppointmentSubmitPanel } from './useCreateAppointmentSubmitPanel';

/**
 * All wizard state, server data, scheduling, save mutation, and navigation for create appointment.
 *
 * @param {object} args
 * @param {object} args.catalog result of {@link useServicesCatalog}
 * @param {string | undefined} args.userId auth user id
 * @param {string | null | undefined} args.accessToken Supabase session JWT for `POST /api/public/bookings`
 * @param {object} args.navigation React Navigation object with `goBack`
 */
export function useCreateAppointmentController({ catalog, userId, accessToken, navigation }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(CREATE_APPOINTMENT_STEP.SERVICE);
  const [servicePickPhase, setServicePickPhase] = useState('chooser');
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [customServiceName, setCustomServiceName] = useState('');
  const [customPriceUsdText, setCustomPriceUsdText] = useState('');
  const [customDurationHhMm, setCustomDurationHhMm] = useState('01:00');
  const [selectedPricingId, setSelectedPricingId] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customer, setCustomer] = useState(createEmptyCustomerForm);
  const [appointmentLocationType, setAppointmentLocationType] = useState(null);
  const [address, setAddress] = useState(createEmptyAddressForm);
  const [vehicle, setVehicle] = useState(createEmptyVehicleForm);
  const [notes, setNotes] = useState('');
  const [successReplayKey, setSuccessReplayKey] = useState(0);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [confirmRequested, setConfirmRequested] = useState(false);

  const catalogError = catalog.businessError || catalog.catalogError;
  const isCustomJob = selectedServiceId === CREATE_APPOINTMENT_CUSTOM_JOB_ID;
  const customPriceRaw = String(customPriceUsdText ?? '')
    .replace(/\$/g, '')
    .trim();
  const parsedCustomPriceCents = parseRequiredCustomJobPriceCents(customPriceRaw);
  const customPriceCents = parsedCustomPriceCents ?? NaN;
  const customPriceError =
    customPriceRaw.length > 0 && parsedCustomPriceCents == null
      ? 'Price must be greater than $0.'
      : undefined;
  const customDurationMinutes = serviceDurationHHmmToMinutes(customDurationHhMm);
  const customJobComplete = Boolean(
    customServiceName.trim() &&
    customPriceRaw.length > 0 &&
    /\d/.test(customPriceRaw) &&
    parsedCustomPriceCents != null &&
    customDurationMinutes > 0,
  );

  const enabledServices = useMemo(
    () => catalog.services.filter((s) => s.isEnabled !== false),
    [catalog.services],
  );

  useEffect(() => {
    setSelectedPricingId(null);
    setSelectedAddonIds([]);
  }, [selectedServiceId]);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDateKey]);

  const customPriceLabel = Number.isFinite(customPriceCents)
    ? `$${(customPriceCents / 100).toFixed(2)}`
    : '$0.00';

  const selectedService = useMemo(() => {
    if (isCustomJob) {
      return {
        id: CREATE_APPOINTMENT_CUSTOM_JOB_ID,
        name: customServiceName.trim(),
        priceLabel: customPriceLabel,
        durationMinutes: customDurationMinutes,
      };
    }
    return catalog.services.find((s) => String(s.id) === String(selectedServiceId)) ?? null;
  }, [
    catalog.services,
    customDurationMinutes,
    customPriceLabel,
    customServiceName,
    isCustomJob,
    selectedServiceId,
  ]);

  const addonsForSelectedService = useMemo(
    () => catalogAddonsForService(selectedServiceId, catalog.addons, catalog.addonAssignments),
    [selectedServiceId, catalog.addons, catalog.addonAssignments],
  );

  const server = useCreateAppointmentServerData({
    businessId: catalog.businessId,
    userId,
    selectedServiceId: isCustomJob ? null : selectedServiceId,
  });

  const selectedServiceRow = useMemo(() => {
    const rows = catalog.serviceRows ?? [];
    return rows.find((r) => String(r.id) === String(selectedServiceId)) ?? null;
  }, [catalog.serviceRows, selectedServiceId]);

  const priceOptionsEnabled = useMemo(
    () => isServicePriceTiersEnabled(selectedServiceRow),
    [selectedServiceRow],
  );

  const pricingPayload = useMemo(() => {
    if (
      server.ownerHasPro &&
      priceOptionsEnabled &&
      server.priceOptionsLoading &&
      !server.priceOptionRows?.length
    ) {
      return { options: [], labelKey: 'label' };
    }
    return buildCreateFlowPricingOptions(
      selectedServiceRow,
      server.priceOptionRows,
      server.ownerHasPro,
    );
  }, [
    selectedServiceRow,
    server.ownerHasPro,
    server.priceOptionRows,
    server.priceOptionsLoading,
    priceOptionsEnabled,
  ]);

  const pricingSkipped = useMemo(
    () =>
      !isCustomJob &&
      shouldSkipCreateFlowPricingStep({
        selectedServiceId,
        selectedServiceRow,
        ownerHasPro: server.ownerHasPro,
        priceOptionsEnabled,
        priceOptionsLoading: server.priceOptionsLoading,
        pricingOptionsCount: pricingPayload.options.length,
      }),
    [
      selectedServiceId,
      selectedServiceRow,
      server.ownerHasPro,
      priceOptionsEnabled,
      server.priceOptionsLoading,
      pricingPayload.options.length,
      isCustomJob,
    ],
  );

  const selectedPricingOption = useMemo(() => {
    if (isCustomJob) {
      return {
        id: CREATE_APPOINTMENT_CUSTOM_JOB_ID,
        label: '',
        priceCents: Number.isFinite(customPriceCents) ? customPriceCents : 0,
        priceLabel: customPriceLabel,
        durationMinutes: customDurationMinutes,
      };
    }
    return getSelectedCreateFlowPricingOption(pricingPayload.options, selectedPricingId);
  }, [
    customDurationMinutes,
    customPriceCents,
    customPriceLabel,
    isCustomJob,
    pricingPayload.options,
    selectedPricingId,
  ]);

  useEffect(() => {
    if (!selectedPricingId) return;
    const options = pricingPayload.options;
    if (!options.length) return;
    if (!options.some((o) => o.id === selectedPricingId)) {
      setSelectedPricingId(null);
    }
  }, [pricingPayload.options, selectedPricingId]);

  useEffect(() => {
    const opts = pricingPayload.options;
    if (opts.length !== 1 || selectedPricingId) return;
    if (priceOptionsEnabled && server.priceOptionsLoading) return;
    setSelectedPricingId(opts[0].id);
  }, [pricingPayload.options, selectedPricingId, priceOptionsEnabled, server.priceOptionsLoading]);

  const selectedAddonRows = useMemo(() => {
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    return addonsForSelectedService.filter((a) => idSet.has(String(a.id)));
  }, [addonsForSelectedService, selectedAddonIds]);

  const totalDurationMinutes = useMemo(
    () =>
      totalBookingDurationMinutes(
        baseServiceDurationMinutes(selectedServiceRow, selectedPricingOption, selectedService),
        selectedAddonRows,
      ),
    [selectedServiceRow, selectedPricingOption, selectedService, selectedAddonRows],
  );

  const appliedSaleDiscount = useMemo(() => {
    const sale = pickActiveSaleForAppointmentDate(server.sales, selectedDateKey);
    if (!sale) return null;
    const baseCents =
      selectedPricingOption?.priceCents != null
        ? Math.round(Number(selectedPricingOption.priceCents) || 0)
        : Math.round(parsePriceLabelToUsd(selectedService?.priceLabel) * 100);
    const addonsCents = selectedAddonRows.reduce(
      (sum, a) => sum + Math.round(parsePriceLabelToUsd(a.priceLabel ?? a.price) * 100),
      0,
    );
    return buildAppliedSaleDiscount({
      subtotalCents: baseCents + addonsCents,
      sale,
    });
  }, [
    selectedAddonRows,
    selectedDateKey,
    selectedPricingOption?.priceCents,
    selectedService?.priceLabel,
    server.sales,
  ]);

  const scheduleLoading =
    server.availabilityLoading || server.blockingLoading || server.priceOptionsLoading;
  const scheduleError =
    server.availabilityError || server.blockingError || server.priceOptionsError || null;

  const bookingCalendar = useBookingCalendar({
    availabilityRow: server.availabilityRow,
    blockingBookingRows: server.blockingBookingRows,
    totalDurationMinutes,
    selectedDateKey,
    selectedTime,
    onSelectDateKey: setSelectedDateKey,
    onSelectTime: setSelectedTime,
    scheduleLoading,
  });

  const { acceptBookings, timeSlots, isDateUnavailable, minDate, maxDate } = bookingCalendar;

  const businessServiceMode = server.businessServiceLocation?.mode ?? null;
  const locationSkipped = useMemo(
    () =>
      !server.businessServiceLocationLoading &&
      isCreateAppointmentLocationStepSkipped(businessServiceMode),
    [server.businessServiceLocationLoading, businessServiceMode],
  );

  const shopAddressForm = useMemo(
    () => addressFormFromBusinessShopLocation(server.businessServiceLocation ?? {}),
    [server.businessServiceLocation],
  );

  const shopAddressMissing = useMemo(
    () =>
      appointmentLocationType === CREATE_APPOINTMENT_LOCATION_SHOP &&
      !isAddressStepComplete(shopAddressForm),
    [appointmentLocationType, shopAddressForm],
  );

  const addressSkipped = useMemo(
    () => isCreateAppointmentAddressStepSkipped(appointmentLocationType),
    [appointmentLocationType],
  );

  useEffect(() => {
    if (server.businessServiceLocationLoading) return;
    if (!locationSkipped) return;
    const defaultType = getDefaultAppointmentLocationType(businessServiceMode);
    if (defaultType) {
      setAppointmentLocationType(defaultType);
    }
  }, [server.businessServiceLocationLoading, locationSkipped, businessServiceMode]);

  useEffect(() => {
    if (appointmentLocationType !== CREATE_APPOINTMENT_LOCATION_SHOP) return;
    setAddress(shopAddressForm);
  }, [appointmentLocationType, shopAddressForm]);

  useEffect(() => {
    if (step !== CREATE_APPOINTMENT_STEP.ADDRESS || !addressSkipped) return;
    setStep(CREATE_APPOINTMENT_STEP.VEHICLE);
  }, [step, addressSkipped]);

  const handleSelectLocationType = useCallback(
    (type) => {
      setAppointmentLocationType(type);
      if (type === CREATE_APPOINTMENT_LOCATION_MOBILE) {
        setAddress(createEmptyAddressForm());
        return;
      }
      setAddress(addressFormFromBusinessShopLocation(server.businessServiceLocation ?? {}));
    },
    [server.businessServiceLocation],
  );

  const submitMutationErrorRef = useRef(/** @type {(error: unknown) => void} */ ((_) => {}));

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const token = String(accessToken ?? '').trim();
      if (!token) {
        throw new Error('Not signed in');
      }
      const body = buildOwnerManualPublicBookingBody({
        catalog,
        selectedService,
        selectedServiceId: isCustomJob ? null : selectedServiceId,
        selectedPricingOption,
        selectedAddonRows,
        totalDurationMinutes,
        selectedDateKey,
        selectedTime,
        customer,
        address,
        vehicle,
        notes,
        appointmentLocationType,
        appliedSaleDiscount,
      });
      const res = await postOwnerManualPublicBooking(token, body);
      if (!res.ok) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        invalidateBookingCachesAfterMutation(queryClient, data.id),
        queryClient.invalidateQueries({
          queryKey: customersListQueryKey(catalog.businessId),
        }),
      ]);
      setSuccessReplayKey((n) => n + 1);
      setAppointmentConfirmed(true);
      InteractionManager.runAfterInteractions(() => {
        showAppointmentConfirmationSmsToast(toast, customer.phone, customer.email, data.smsOutcome);
      });
    },
    onError: (e) => {
      submitMutationErrorRef.current(e);
    },
  });

  const {
    clearSubmitError,
    handleMutationError,
    shouldNotifyCustomer,
    isSubmitting,
    showSubmitPanel,
    submitError,
  } = useCreateAppointmentSubmitPanel({
    step,
    appointmentConfirmed,
    isMutationPending: createBookingMutation.isPending,
    confirmRequested,
    customerPhone: customer.phone,
    customerEmail: customer.email,
  });
  submitMutationErrorRef.current = handleMutationError;

  const addonCatalogKnown = !catalog.isLoading && !catalogError;
  const addonsCount = addonsForSelectedService.length;
  const addonsSkipped = useMemo(
    () => isCustomJob || isAddonsStepSkipped(addonCatalogKnown, addonsCount),
    [addonCatalogKnown, addonsCount, isCustomJob],
  );

  useEffect(() => {
    if (!addonCatalogKnown) return;
    if (step === CREATE_APPOINTMENT_STEP.ADDONS && addonsSkipped) {
      setStep(CREATE_APPOINTMENT_STEP.SCHEDULE);
    }
  }, [addonCatalogKnown, addonsSkipped, step]);

  useEffect(() => {
    if (step !== CREATE_APPOINTMENT_STEP.PRICING || !pricingSkipped) return;
    setStep(
      getNextStepOnContinue({
        step: CREATE_APPOINTMENT_STEP.PRICING,
        addonsSkipped,
        pricingSkipped: true,
        locationSkipped,
        addressSkipped,
      }),
    );
  }, [step, pricingSkipped, addonsSkipped, locationSkipped, addressSkipped]);

  const canContinue = useMemo(
    () =>
      canContinueCreateAppointmentStep({
        appointmentConfirmed,
        step,
        selectedServiceId,
        selectedPricingId,
        servicePickPhase,
        isCustomJob,
        customJobComplete,
        pricingSkipped,
        locationSkipped,
        addressSkipped,
        businessServiceLocationLoading: server.businessServiceLocationLoading,
        pricingOptions: pricingPayload.options,
        priceOptionsLoading: server.priceOptionsLoading,
        priceOptionsEnabled,
        acceptBookings,
        scheduleLoading,
        selectedDateKey,
        selectedTime,
        timeSlots,
        customer,
        appointmentLocationType,
        shopAddressMissing,
        address,
        vehicle,
      }),
    [
      appointmentConfirmed,
      step,
      selectedServiceId,
      selectedPricingId,
      servicePickPhase,
      isCustomJob,
      customJobComplete,
      pricingSkipped,
      locationSkipped,
      addressSkipped,
      server.businessServiceLocationLoading,
      pricingPayload.options,
      server.priceOptionsLoading,
      priceOptionsEnabled,
      acceptBookings,
      scheduleLoading,
      selectedDateKey,
      selectedTime,
      timeSlots,
      customer,
      appointmentLocationType,
      shopAddressMissing,
      address,
      vehicle,
    ],
  );

  const meta = CREATE_APPOINTMENT_STEP_META[step];
  const addressStepCopy = useMemo(
    () => getCreateAppointmentAddressStepCopy(appointmentLocationType),
    [appointmentLocationType],
  );

  const wizardHeader = useMemo(() => {
    if (appointmentConfirmed) {
      return null;
    }
    const skipArgs = { pricingSkipped, addonsSkipped, locationSkipped, addressSkipped };
    const stepCount = getCreateAppointmentWizardStepCount(skipArgs);
    const stepIndex = getCreateAppointmentWizardStepIndex(step, skipArgs);
    const { title, subtitle } = resolveCreateAppointmentWizardHeader(step, meta, addressStepCopy, {
      servicePickPhase,
      isCustomJob,
    });
    return {
      stepIndex,
      stepCount,
      title,
      subtitle,
      scrollWithContent: step === CREATE_APPOINTMENT_STEP.REVIEW,
    };
  }, [
    addonsSkipped,
    addressSkipped,
    addressStepCopy,
    appointmentConfirmed,
    locationSkipped,
    meta,
    pricingSkipped,
    servicePickPhase,
    isCustomJob,
    step,
  ]);

  const handleChooseServices = useCallback(() => {
    if (isCustomJob) {
      setSelectedServiceId(null);
    }
    setServicePickPhase('catalog');
  }, [isCustomJob]);

  const handleChooseCustomJob = useCallback(() => {
    setSelectedServiceId(CREATE_APPOINTMENT_CUSTOM_JOB_ID);
    setSelectedPricingId(null);
    setSelectedAddonIds([]);
    setStep(CREATE_APPOINTMENT_STEP.PRICING);
  }, []);

  const handleSelectServiceId = useCallback((serviceId) => {
    setSelectedServiceId(serviceId);
  }, []);

  const handleBack = useCallback(() => {
    if (appointmentConfirmed) {
      navigation.goBack();
      return;
    }
    if (submitError) {
      clearSubmitError();
    }
    if (step === CREATE_APPOINTMENT_STEP.SERVICE && servicePickPhase === 'catalog') {
      setServicePickPhase('chooser');
      return;
    }
    if (step === CREATE_APPOINTMENT_STEP.PRICING && isCustomJob) {
      setStep(CREATE_APPOINTMENT_STEP.SERVICE);
      setServicePickPhase('chooser');
      return;
    }
    if (step > CREATE_APPOINTMENT_STEP.SERVICE) {
      setStep(
        getPreviousStepOnBack({
          step,
          addonsSkipped,
          pricingSkipped,
          locationSkipped,
          addressSkipped,
        }),
      );
      return;
    }
    navigation.goBack();
  }, [
    addonsSkipped,
    addressSkipped,
    appointmentConfirmed,
    clearSubmitError,
    locationSkipped,
    navigation,
    pricingSkipped,
    servicePickPhase,
    isCustomJob,
    step,
    submitError,
  ]);

  const handleContinue = useCallback(async () => {
    if (appointmentConfirmed) return;
    if (confirmRequested || createBookingMutation.isPending) return;
    if (!canContinue) return;
    if (step === CREATE_APPOINTMENT_LAST_STEP) {
      clearSubmitError();
      setConfirmRequested(true);
      let freshSchedule;
      try {
        freshSchedule = await server.refreshSchedulingData();
      } catch {
        setConfirmRequested(false);
        handleMutationError(
          new Error('Could not refresh availability. Check your connection and try again.'),
        );
        return;
      }

      const {
        acceptBookings: freshAcceptBookings,
        weeklySchedule,
        timeOffBlocks,
      } = parseScheduleInputs(freshSchedule.availabilityRow);
      const freshScheduleCtx = {
        acceptBookings: freshAcceptBookings,
        weeklySchedule,
        timeOffBlocks,
        blockingBookingRows: freshSchedule.blockingBookingRows,
        totalDurationMinutes,
      };
      const { dateValid, timeValid } = isSelectedScheduleStillValid(
        freshScheduleCtx,
        selectedDateKey,
        selectedTime,
        { scheduleLoading: false },
      );
      if (!dateValid || !timeValid) {
        if (!dateValid) setSelectedDateKey(null);
        setSelectedTime(null);
        setStep(CREATE_APPOINTMENT_STEP.SCHEDULE);
        setConfirmRequested(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        toast.info('That time is no longer available. Choose another time.');
        return;
      }

      createBookingMutation.mutate(undefined, {
        onSettled: () => {
          setConfirmRequested(false);
        },
      });
      return;
    }
    setStep(
      getNextStepOnContinue({
        step,
        addonsSkipped,
        pricingSkipped,
        locationSkipped,
        addressSkipped,
      }),
    );
  }, [
    addonsSkipped,
    addressSkipped,
    appointmentConfirmed,
    canContinue,
    clearSubmitError,
    confirmRequested,
    createBookingMutation,
    handleMutationError,
    locationSkipped,
    pricingSkipped,
    selectedDateKey,
    selectedTime,
    server,
    step,
    toast,
    totalDurationMinutes,
  ]);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleAddon = useCallback((id) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const styles = useMemo(() => createAppointmentFlowStyles(), []);

  const stepContentProps = useMemo(
    () => ({
      step,
      appointmentConfirmed,
      confirmationReplayKey: successReplayKey,
      catalogError,
      catalogIsLoading: catalog.isLoading,
      enabledServices,
      categories: catalog.categories,
      servicePickPhase,
      isCustomJob,
      selectedServiceId,
      onChooseServices: handleChooseServices,
      onChooseCustomJob: handleChooseCustomJob,
      onSelectServiceId: handleSelectServiceId,
      customServiceName,
      customPriceUsdText,
      customPriceError,
      customDurationHhMm,
      onCustomServiceNameChange: setCustomServiceName,
      onCustomPriceUsdTextChange: setCustomPriceUsdText,
      onCustomDurationHhMmChange: setCustomDurationHhMm,
      pricingOptions: pricingPayload.options,
      priceOptionsLoading: server.priceOptionsLoading,
      selectedPricingId,
      selectedService,
      onSelectPricingId: setSelectedPricingId,
      selectedAddonIds,
      selectedPricingOption,
      addonsForSelectedService,
      onToggleAddon: toggleAddon,
      acceptBookings,
      isDateUnavailable,
      maxDate,
      minDate,
      scheduleError,
      scheduleLoading,
      selectedDateKey,
      selectedTime,
      timeSlots,
      onSelectDateKey: setSelectedDateKey,
      onSelectTime: setSelectedTime,
      customer,
      onChangeCustomer: setCustomer,
      appointmentLocationType,
      onSelectLocationType: handleSelectLocationType,
      shopAddressMissing,
      address,
      onChangeAddress: setAddress,
      vehicle,
      notes,
      totalDurationMinutes,
      onChangeVehicle: setVehicle,
      onChangeNotes: setNotes,
      showSubmitPanel,
      appliedSaleDiscount,
    }),
    [
      step,
      appointmentConfirmed,
      successReplayKey,
      showSubmitPanel,
      catalogError,
      catalog.isLoading,
      enabledServices,
      catalog.categories,
      servicePickPhase,
      isCustomJob,
      selectedServiceId,
      handleChooseServices,
      handleChooseCustomJob,
      handleSelectServiceId,
      customServiceName,
      customPriceUsdText,
      customPriceError,
      customDurationHhMm,
      pricingPayload.options,
      server.priceOptionsLoading,
      selectedPricingId,
      selectedService,
      selectedAddonIds,
      selectedPricingOption,
      addonsForSelectedService,
      toggleAddon,
      acceptBookings,
      isDateUnavailable,
      maxDate,
      minDate,
      scheduleError,
      scheduleLoading,
      selectedDateKey,
      selectedTime,
      timeSlots,
      customer,
      appointmentLocationType,
      handleSelectLocationType,
      address,
      shopAddressMissing,
      vehicle,
      notes,
      totalDurationMinutes,
      appliedSaleDiscount,
    ],
  );

  return {
    styles,
    step,
    appointmentConfirmed,
    showSubmitPanel,
    submitPanel: {
      visible: showSubmitPanel,
      active: isSubmitting || confirmRequested,
      error: submitError,
      shouldNotifyCustomer,
      onRetry: clearSubmitError,
    },
    wizardHeader,
    stepContentProps,
    footer: {
      appointmentConfirmed,
      canContinue,
      confirmLoading: confirmRequested || createBookingMutation.isPending,
      hideWhileSubmitPanel: showSubmitPanel,
      lastStepIndex: CREATE_APPOINTMENT_LAST_STEP,
      step,
      backTitle:
        step === CREATE_APPOINTMENT_STEP.SERVICE && servicePickPhase === 'catalog'
          ? 'Back'
          : undefined,
      onBack: handleBack,
      onContinue: handleContinue,
      onDone: handleDone,
    },
  };
}
