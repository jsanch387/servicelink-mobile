import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { showUserFacingErrorAlert } from '../../../../utils/safeUserFacingMessage';
import { useTheme } from '../../../../theme';
import { invalidateBookingCachesAfterMutation } from '../../booking-details/utils/invalidateBookingCachesAfterMutation';
import { updateBookingById } from '../api/updateBookingById';
import { buildEditBookingUpdatePayload } from '../utils/buildEditBookingUpdatePayload';
import { splitBookingServiceName } from '../../../../utils/splitBookingServiceName';
import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import { useCreateAppointmentServerData } from '../../create-appointment/hooks/useCreateAppointmentServerData';
import { createAppointmentFlowStyles } from '../../create-appointment/styles/createAppointmentFlowStyles';
import { canContinueCreateAppointmentStep } from '../../create-appointment/utils/createFlowContinueGate';
import {
  baseServiceDurationMinutes,
  totalBookingDurationMinutes,
} from '../../create-appointment/utils/createFlowDuration';
import {
  getCreateAppointmentProgressFraction,
  getNextStepOnContinue,
  isAddonsStepSkipped,
} from '../../create-appointment/utils/createFlowNavigation';
import {
  buildCreateFlowPricingOptions,
  getSelectedCreateFlowPricingOption,
  isServicePriceTiersEnabled,
  shouldSkipCreateFlowPricingStep,
} from '../../create-appointment/utils/createFlowPricing';
import {
  isAddressStepComplete,
  isReviewStepComplete,
} from '../../create-appointment/utils/createAppointmentValidators';
import {
  CREATE_APPOINTMENT_LOCATION_MOBILE,
  CREATE_APPOINTMENT_LOCATION_SHOP,
  addressFormFromBusinessShopLocation,
  getCreateAppointmentAddressStepCopy,
  getDefaultAppointmentLocationType,
  isCreateAppointmentAddressStepSkipped,
  isCreateAppointmentLocationStepSkipped,
} from '../../create-appointment/utils/createAppointmentServiceLocation';
import { useBookingCalendar } from '../../../availability/booking';
import {
  EDIT_APPOINTMENT_HUB,
  EDIT_APPOINTMENT_LAST_STEP,
  EDIT_APPOINTMENT_STEP,
  EDIT_APPOINTMENT_STEP_META,
  createEmptyAddressForm,
  createEmptyCustomerForm,
  createEmptyVehicleForm,
  editAppointmentStepShowsMainTitle,
} from '../constants';
import { buildEditHubSections } from '../utils/buildEditHubSections';
import {
  bookingHasAddonDetails,
  mapBookingToEditAppointmentForm,
  matchCatalogServiceIdByName,
  resolveEditAppointmentAddonIds,
  resolveEditAppointmentPricingId,
} from '../utils/mapBookingToEditAppointmentForm';

/**
 * Edit-appointment wizard state and navigation. Reuses create-flow steps and validators.
 *
 * @param {object} args
 * @param {string | undefined} args.bookingId route param for the booking being edited
 * @param {Record<string, unknown> | null | undefined} args.booking loaded booking row
 * @param {boolean} args.bookingLoading
 * @param {string | null | undefined} args.bookingErrorMessage
 * @param {object} args.catalog result of {@link useServicesCatalog}
 * @param {string | undefined} args.userId auth user id
 * @param {object} args.navigation React Navigation object with `goBack`
 */
export function useEditAppointmentController({
  bookingId,
  booking,
  bookingLoading,
  bookingErrorMessage,
  catalog,
  userId,
  navigation,
}) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const prefillAppliedRef = useRef(false);
  const skipServiceResetRef = useRef(false);
  const skipDateResetRef = useRef(false);
  const schedulePrefillSyncedRef = useRef(false);
  const pricingPrefillSyncedRef = useRef(false);
  const addonsPrefillSyncedRef = useRef(false);
  const [prefillReady, setPrefillReady] = useState(false);

  const [step, setStep] = useState(EDIT_APPOINTMENT_HUB);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedPricingId, setSelectedPricingId] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customer, setCustomer] = useState(createEmptyCustomerForm);
  const [appointmentLocationType, setAppointmentLocationType] = useState(null);
  const [address, setAddress] = useState(createEmptyAddressForm);
  const [vehicle, setVehicle] = useState(createEmptyVehicleForm);
  const [notes, setNotes] = useState('');
  const [pinnedSchedule, setPinnedSchedule] = useState(
    /** @type {{ dateKey: string | null; time: string | null } | null} */ (null),
  );

  const catalogError = catalog.businessError || catalog.catalogError;

  const enabledServices = useMemo(
    () => catalog.services.filter((s) => s.isEnabled !== false),
    [catalog.services],
  );

  useEffect(() => {
    prefillAppliedRef.current = false;
    schedulePrefillSyncedRef.current = false;
    pricingPrefillSyncedRef.current = false;
    addonsPrefillSyncedRef.current = false;
    setPrefillReady(false);
    setPinnedSchedule(null);
  }, [bookingId]);

  const bookingServiceIdForPrefill = useMemo(() => {
    if (bookingLoading || !booking || catalog.isLoading) {
      return null;
    }
    const serviceIdRaw = booking.service_id;
    if (serviceIdRaw != null && String(serviceIdRaw).trim()) {
      return String(serviceIdRaw).trim();
    }
    const { primary } = splitBookingServiceName(booking.service_name);
    return matchCatalogServiceIdByName(enabledServices, primary);
  }, [booking, bookingLoading, catalog.isLoading, enabledServices]);

  const prefillServiceRow = useMemo(() => {
    if (!bookingServiceIdForPrefill) {
      return null;
    }
    const rows = catalog.serviceRows ?? [];
    return rows.find((r) => String(r.id) === String(bookingServiceIdForPrefill)) ?? null;
  }, [bookingServiceIdForPrefill, catalog.serviceRows]);

  useEffect(() => {
    if (skipServiceResetRef.current) {
      skipServiceResetRef.current = false;
      return;
    }
    setSelectedPricingId(null);
    setSelectedAddonIds([]);
  }, [selectedServiceId]);

  useEffect(() => {
    if (skipDateResetRef.current) {
      skipDateResetRef.current = false;
      return;
    }
    setSelectedTime(null);
  }, [selectedDateKey]);

  const handleSelectDateKey = useCallback(
    (dateKey) => {
      if (dateKey !== selectedDateKey) {
        setSelectedTime(null);
      }
      setSelectedDateKey(dateKey);
    },
    [selectedDateKey],
  );

  const selectedService = useMemo(
    () => catalog.services.find((s) => String(s.id) === String(selectedServiceId)) ?? null,
    [catalog.services, selectedServiceId],
  );

  const addonsForSelectedService = useMemo(
    () => catalogAddonsForService(selectedServiceId, catalog.addons, catalog.addonAssignments),
    [selectedServiceId, catalog.addons, catalog.addonAssignments],
  );

  const server = useCreateAppointmentServerData({
    businessId: catalog.businessId,
    userId,
    selectedServiceId: selectedServiceId ?? bookingServiceIdForPrefill,
    excludeBookingId: bookingId,
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
    ],
  );

  const selectedPricingOption = useMemo(
    () => getSelectedCreateFlowPricingOption(pricingPayload.options, selectedPricingId),
    [pricingPayload.options, selectedPricingId],
  );

  const needsTieredPricingRows = useMemo(() => {
    const row = prefillServiceRow ?? selectedServiceRow;
    return Boolean(row && isServicePriceTiersEnabled(row) && server.ownerHasPro);
  }, [prefillServiceRow, selectedServiceRow, server.ownerHasPro]);

  useEffect(() => {
    if (!selectedPricingId) return;
    if (!pricingPrefillSyncedRef.current && needsTieredPricingRows) {
      return;
    }
    const options = pricingPayload.options;
    if (!options.length) return;
    if (!options.some((o) => o.id === selectedPricingId)) {
      setSelectedPricingId(null);
    }
  }, [needsTieredPricingRows, pricingPayload.options, selectedPricingId]);

  useEffect(() => {
    const opts = pricingPayload.options;
    if (opts.length !== 1 || selectedPricingId) return;
    if (priceOptionsEnabled && server.priceOptionsLoading) return;
    if (!pricingPrefillSyncedRef.current && needsTieredPricingRows) return;
    setSelectedPricingId(opts[0].id);
  }, [
    needsTieredPricingRows,
    pricingPayload.options,
    priceOptionsEnabled,
    selectedPricingId,
    server.priceOptionsLoading,
  ]);

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
    onSelectDateKey: handleSelectDateKey,
    onSelectTime: setSelectedTime,
    scheduleLoading,
    relaxScheduleValidation: Boolean(pinnedSchedule),
    pinnedDateKey: pinnedSchedule?.dateKey ?? null,
    pinnedTime: pinnedSchedule?.time ?? null,
  });

  /** One-time re-apply after availability loads — must not run when the user picks a new date. */
  useEffect(() => {
    if (!prefillReady || scheduleLoading || !pinnedSchedule || schedulePrefillSyncedRef.current) {
      return;
    }
    schedulePrefillSyncedRef.current = true;
    if (pinnedSchedule.dateKey) {
      setSelectedDateKey(pinnedSchedule.dateKey);
    }
    if (pinnedSchedule.time) {
      setSelectedTime(pinnedSchedule.time);
    }
  }, [prefillReady, pinnedSchedule, scheduleLoading]);

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

  const pricingDataReadyForPrefill = useMemo(() => {
    if (bookingLoading || !booking || catalog.isLoading) {
      return false;
    }
    if (server.businessServiceLocationLoading) {
      return false;
    }
    if (!bookingServiceIdForPrefill || !prefillServiceRow) {
      return true;
    }
    const tiersEnabled = isServicePriceTiersEnabled(prefillServiceRow);
    if (server.ownerHasPro && tiersEnabled && server.priceOptionsLoading) {
      return false;
    }
    return true;
  }, [
    booking,
    bookingLoading,
    bookingServiceIdForPrefill,
    catalog.isLoading,
    prefillServiceRow,
    server.businessServiceLocationLoading,
    server.ownerHasPro,
    server.priceOptionsLoading,
  ]);

  useEffect(() => {
    if (prefillAppliedRef.current || bookingLoading || !booking || bookingErrorMessage) {
      return;
    }
    if (!pricingDataReadyForPrefill) {
      return;
    }

    const form = mapBookingToEditAppointmentForm({
      booking,
      catalog,
      ownerHasPro: server.ownerHasPro,
      priceOptionRows: server.priceOptionRows,
      shopAddressForm,
      businessServiceMode,
    });

    if (!form) {
      return;
    }

    prefillAppliedRef.current = true;
    skipServiceResetRef.current = true;
    skipDateResetRef.current = true;

    setSelectedServiceId(form.selectedServiceId);
    setSelectedPricingId(form.selectedPricingId);
    setSelectedAddonIds(form.selectedAddonIds);
    setSelectedDateKey(form.selectedDateKey);
    setSelectedTime(form.selectedTime);
    setCustomer(form.customer);
    setAppointmentLocationType(form.appointmentLocationType);
    setAddress(form.address);
    setVehicle(form.vehicle);
    setNotes(form.notes);
    setPinnedSchedule({ dateKey: form.selectedDateKey, time: form.selectedTime });
    setPrefillReady(true);
  }, [
    booking,
    bookingErrorMessage,
    bookingLoading,
    businessServiceMode,
    catalog,
    pricingDataReadyForPrefill,
    server.ownerHasPro,
    server.priceOptionRows,
    shopAddressForm,
  ]);

  /** One-time pricing tier sync after Pro price-option rows finish loading. */
  useEffect(() => {
    if (!prefillReady || !booking || pricingPrefillSyncedRef.current) {
      return;
    }
    if (server.priceOptionsLoading) {
      return;
    }

    const serviceId = selectedServiceId ?? bookingServiceIdForPrefill;
    if (!serviceId) {
      pricingPrefillSyncedRef.current = true;
      return;
    }

    const row = (catalog.serviceRows ?? []).find((r) => String(r.id) === String(serviceId)) ?? null;
    const tiersEnabled = Boolean(row && isServicePriceTiersEnabled(row));
    if (tiersEnabled && server.ownerHasPro && !server.priceOptionRows?.length) {
      return;
    }

    const resolvedPricingId = resolveEditAppointmentPricingId({
      booking,
      catalog,
      ownerHasPro: server.ownerHasPro,
      priceOptionRows: server.priceOptionRows,
      serviceId,
    });

    if (resolvedPricingId) {
      setSelectedPricingId(resolvedPricingId);
    }
    pricingPrefillSyncedRef.current = true;
  }, [
    booking,
    bookingServiceIdForPrefill,
    catalog,
    prefillReady,
    selectedServiceId,
    server.ownerHasPro,
    server.priceOptionRows,
    server.priceOptionsLoading,
  ]);

  /** One-time add-on sync after catalog assignments are available for the service. */
  useEffect(() => {
    if (!prefillReady || !booking || addonsPrefillSyncedRef.current) {
      return;
    }
    if (catalog.isLoading) {
      return;
    }

    const serviceId = selectedServiceId ?? bookingServiceIdForPrefill;
    if (!serviceId) {
      addonsPrefillSyncedRef.current = true;
      return;
    }

    const availableAddons = catalogAddonsForService(
      serviceId,
      catalog.addons,
      catalog.addonAssignments,
    );
    const bookingHasAddons = bookingHasAddonDetails(booking.addon_details);
    if (bookingHasAddons && !availableAddons.length && catalog.addonAssignments == null) {
      return;
    }

    const resolvedAddonIds = resolveEditAppointmentAddonIds({
      booking,
      catalogAddonsForService: availableAddons,
    });

    if (resolvedAddonIds.length > 0) {
      setSelectedAddonIds(resolvedAddonIds);
    }
    addonsPrefillSyncedRef.current = true;
  }, [
    booking,
    bookingServiceIdForPrefill,
    catalog.addonAssignments,
    catalog.addons,
    catalog.isLoading,
    prefillReady,
    selectedServiceId,
  ]);

  useEffect(() => {
    if (prefillAppliedRef.current) return;
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
    if (step !== EDIT_APPOINTMENT_STEP.ADDRESS || !addressSkipped) return;
    if (step === EDIT_APPOINTMENT_HUB) return;
    setStep(EDIT_APPOINTMENT_STEP.VEHICLE);
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

  const addonCatalogKnown = !catalog.isLoading && !catalogError;
  const addonsCount = addonsForSelectedService.length;
  const addonsSkipped = useMemo(
    () => isAddonsStepSkipped(addonCatalogKnown, addonsCount),
    [addonCatalogKnown, addonsCount],
  );

  useEffect(() => {
    if (!addonCatalogKnown) return;
    if (step === EDIT_APPOINTMENT_STEP.ADDONS && addonsSkipped) {
      setStep(EDIT_APPOINTMENT_STEP.SCHEDULE);
    }
  }, [addonCatalogKnown, addonsSkipped, step]);

  useEffect(() => {
    if (step !== EDIT_APPOINTMENT_STEP.PRICING || !pricingSkipped) return;
    setStep(
      getNextStepOnContinue({
        step: EDIT_APPOINTMENT_STEP.PRICING,
        addonsSkipped,
        pricingSkipped: true,
        locationSkipped,
        addressSkipped,
      }),
    );
  }, [step, pricingSkipped, addonsSkipped, locationSkipped, addressSkipped]);

  const canContinue = useMemo(() => {
    if (step === EDIT_APPOINTMENT_HUB) {
      return false;
    }
    return canContinueCreateAppointmentStep({
      appointmentConfirmed: false,
      step,
      selectedServiceId,
      selectedPricingId,
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
    });
  }, [
    step,
    selectedServiceId,
    selectedPricingId,
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
  ]);

  const canSave = useMemo(
    () =>
      isReviewStepComplete({
        selectedServiceId,
        selectedPricingId,
        pricingOptions: pricingPayload.options,
        priceOptionsLoading: server.priceOptionsLoading,
        priceOptionsEnabled,
        selectedDateKey,
        selectedTime,
        customer,
        appointmentLocationType,
        locationSkipped,
        address,
        vehicle,
      }),
    [
      selectedServiceId,
      selectedPricingId,
      pricingPayload.options,
      server.priceOptionsLoading,
      priceOptionsEnabled,
      selectedDateKey,
      selectedTime,
      customer,
      appointmentLocationType,
      locationSkipped,
      address,
      vehicle,
    ],
  );

  const isHubView = step === EDIT_APPOINTMENT_HUB;

  const hubSections = useMemo(
    () =>
      buildEditHubSections({
        pricingSkipped,
        addonsSkipped,
        locationSkipped,
        addressSkipped,
        selectedService,
        selectedPricingOption,
        selectedAddonRows,
        selectedDateKey,
        selectedTime,
        customer,
        appointmentLocationType,
        address,
        vehicle,
        notes,
      }),
    [
      pricingSkipped,
      addonsSkipped,
      locationSkipped,
      addressSkipped,
      selectedService,
      selectedPricingOption,
      selectedAddonRows,
      selectedDateKey,
      selectedTime,
      customer,
      appointmentLocationType,
      address,
      vehicle,
      notes,
    ],
  );

  const openEditSection = useCallback((targetStep) => {
    setStep(targetStep);
  }, []);

  const returnToHub = useCallback(() => {
    setStep(EDIT_APPOINTMENT_HUB);
  }, []);

  const progressPercent = useMemo(
    () =>
      isHubView
        ? 0
        : getCreateAppointmentProgressFraction(step, {
            appointmentConfirmed: false,
            pricingSkipped,
            addonsSkipped,
            locationSkipped,
            addressSkipped,
          }) * 100,
    [isHubView, step, pricingSkipped, addonsSkipped, locationSkipped, addressSkipped],
  );

  const meta = isHubView ? null : EDIT_APPOINTMENT_STEP_META[step];
  const addressStepCopy = useMemo(
    () => getCreateAppointmentAddressStepCopy(appointmentLocationType),
    [appointmentLocationType],
  );
  const mainTitle = useMemo(() => {
    if (step === EDIT_APPOINTMENT_STEP.ADDRESS) return addressStepCopy.title;
    return meta?.title ?? '';
  }, [step, addressStepCopy.title, meta?.title]);
  const mainSubtitle = useMemo(() => {
    if (step === EDIT_APPOINTMENT_STEP.ADDRESS) return addressStepCopy.subtitle;
    return meta?.subtitle ?? '';
  }, [step, addressStepCopy.subtitle, meta?.subtitle]);

  const updateBookingMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) {
        throw new Error('Missing booking');
      }
      const payload = buildEditBookingUpdatePayload({
        selectedService,
        selectedServiceId,
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
      });
      const { data, error } = await updateBookingById(bookingId, payload, catalog.businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not save changes');
      }
      if (!data) {
        throw new Error('Could not save changes');
      }
      return data;
    },
    onSuccess: async () => {
      await invalidateBookingCachesAfterMutation(queryClient, bookingId);
      navigation.goBack();
    },
    onError: (e) => {
      showUserFacingErrorAlert('Could not save changes', e, { fallback: 'Try again.' });
    },
  });

  const handleBack = useCallback(() => {
    if (isHubView) {
      navigation.goBack();
      return;
    }
    returnToHub();
  }, [isHubView, navigation, returnToHub]);

  const handleSave = useCallback(() => {
    if (!canSave || updateBookingMutation.isPending) return;
    updateBookingMutation.mutate();
  }, [canSave, updateBookingMutation]);

  const handleContinue = useCallback(() => {
    if (isHubView) {
      handleSave();
      return;
    }
    if (!canContinue || updateBookingMutation.isPending) return;
    returnToHub();
  }, [canContinue, handleSave, isHubView, returnToHub, updateBookingMutation.isPending]);

  const toggleAddon = useCallback((id) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const styles = useMemo(() => createAppointmentFlowStyles(colors), [colors]);

  const stepContentProps = useMemo(
    () => ({
      step,
      appointmentConfirmed: false,
      catalogError,
      catalogIsLoading: catalog.isLoading,
      enabledServices,
      categories: catalog.categories,
      selectedServiceId,
      onSelectServiceId: setSelectedServiceId,
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
      onSelectDateKey: handleSelectDateKey,
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
    }),
    [
      step,
      catalogError,
      catalog.isLoading,
      enabledServices,
      catalog.categories,
      selectedServiceId,
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
      handleSelectDateKey,
      customer,
      appointmentLocationType,
      handleSelectLocationType,
      address,
      shopAddressMissing,
      vehicle,
      notes,
      totalDurationMinutes,
    ],
  );

  return {
    styles,
    progressPercent,
    showMainTitle: !isHubView && editAppointmentStepShowsMainTitle(step),
    mainTitle,
    mainSubtitle,
    stepContentProps,
    isHubView,
    hubSections,
    openEditSection,
    isInitializing: Boolean(bookingId) && !bookingErrorMessage && !prefillReady,
    bookingErrorMessage,
    footer: {
      appointmentConfirmed: false,
      canContinue: isHubView ? canSave && !updateBookingMutation.isPending : canContinue,
      confirmLoading: updateBookingMutation.isPending,
      editHubMode: isHubView,
      editSectionMode: !isHubView,
      lastStepIndex: EDIT_APPOINTMENT_LAST_STEP,
      lastStepPrimaryTitle: 'Save changes',
      lastStepAccessibilityLabel: 'Save appointment changes',
      sectionPrimaryTitle: 'Done',
      step,
      onBack: handleBack,
      onContinue: handleContinue,
      onDone: handleBack,
    },
  };
}
