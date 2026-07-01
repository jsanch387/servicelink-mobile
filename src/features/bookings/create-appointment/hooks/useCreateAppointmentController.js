import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { showUserFacingErrorAlert } from '../../../../utils/safeUserFacingMessage';
import { useTheme } from '../../../../theme';
import { customersListQueryKey } from '../../../customers/queryKeys';
import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import { postOwnerManualPublicBooking } from '../api/postOwnerManualPublicBooking';
import {
  CREATE_APPOINTMENT_LAST_STEP,
  CREATE_APPOINTMENT_STEP,
  CREATE_APPOINTMENT_STEP_META,
  createAppointmentStepShowsMainTitle,
  createEmptyAddressForm,
  createEmptyCustomerForm,
  createEmptyVehicleForm,
} from '../constants';
import { isAddressStepComplete } from '../utils/createAppointmentValidators';
import { buildOwnerManualPublicBookingBody } from '../utils/buildOwnerBookingPayload';
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
  getCreateAppointmentProgressFraction,
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
import { createAppointmentFlowStyles } from '../styles/createAppointmentFlowStyles';
import { useCreateAppointmentServerData } from './useCreateAppointmentServerData';

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
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(CREATE_APPOINTMENT_STEP.SERVICE);
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
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);

  const catalogError = catalog.businessError || catalog.catalogError;

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
    selectedServiceId,
  });

  const selectedServiceRow = useMemo(() => {
    const rows = catalog.serviceRows ?? [];
    return rows.find((r) => String(r.id) === String(selectedServiceId)) ?? null;
  }, [catalog.serviceRows, selectedServiceId]);

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

  const priceOptionsEnabled = useMemo(
    () => isServicePriceTiersEnabled(selectedServiceRow),
    [selectedServiceRow],
  );

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

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const token = String(accessToken ?? '').trim();
      if (!token) {
        throw new Error('Not signed in');
      }
      const body = buildOwnerManualPublicBookingBody({
        catalog,
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
      setAppointmentConfirmed(true);
    },
    onError: (e) => {
      showUserFacingErrorAlert('Could not create booking', e, { fallback: 'Try again.' });
    },
  });

  const addonCatalogKnown = !catalog.isLoading && !catalogError;
  const addonsCount = addonsForSelectedService.length;
  const addonsSkipped = useMemo(
    () => isAddonsStepSkipped(addonCatalogKnown, addonsCount),
    [addonCatalogKnown, addonsCount],
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

  const progressPercent = useMemo(
    () =>
      getCreateAppointmentProgressFraction(step, {
        appointmentConfirmed,
        pricingSkipped,
        addonsSkipped,
        locationSkipped,
        addressSkipped,
      }) * 100,
    [appointmentConfirmed, step, pricingSkipped, addonsSkipped, locationSkipped, addressSkipped],
  );

  const meta = CREATE_APPOINTMENT_STEP_META[step];
  const addressStepCopy = useMemo(
    () => getCreateAppointmentAddressStepCopy(appointmentLocationType),
    [appointmentLocationType],
  );
  const mainTitle = useMemo(() => {
    if (appointmentConfirmed) return '';
    if (step === CREATE_APPOINTMENT_STEP.ADDRESS) return addressStepCopy.title;
    return meta?.title ?? '';
  }, [appointmentConfirmed, step, addressStepCopy.title, meta?.title]);
  const mainSubtitle = useMemo(() => {
    if (appointmentConfirmed) return '';
    if (step === CREATE_APPOINTMENT_STEP.ADDRESS) return addressStepCopy.subtitle;
    return meta?.subtitle ?? '';
  }, [appointmentConfirmed, step, addressStepCopy.subtitle, meta?.subtitle]);

  const handleBack = useCallback(() => {
    if (appointmentConfirmed) {
      navigation.goBack();
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
    locationSkipped,
    navigation,
    pricingSkipped,
    step,
  ]);

  const handleContinue = useCallback(() => {
    if (appointmentConfirmed) return;
    if (!canContinue) return;
    if (step === CREATE_APPOINTMENT_LAST_STEP) {
      createBookingMutation.mutate();
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
    createBookingMutation,
    locationSkipped,
    pricingSkipped,
    step,
  ]);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleAddon = useCallback((id) => {
    setSelectedAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const styles = useMemo(() => createAppointmentFlowStyles(colors), [colors]);

  const stepContentProps = useMemo(
    () => ({
      step,
      appointmentConfirmed,
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
    }),
    [
      step,
      appointmentConfirmed,
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
    step,
    progressPercent,
    appointmentConfirmed,
    showMainTitle: createAppointmentStepShowsMainTitle(step) && !appointmentConfirmed,
    mainTitle,
    mainSubtitle,
    stepContentProps,
    footer: {
      appointmentConfirmed,
      canContinue,
      confirmLoading: createBookingMutation.isPending,
      lastStepIndex: CREATE_APPOINTMENT_LAST_STEP,
      step,
      onBack: handleBack,
      onContinue: handleContinue,
      onDone: handleDone,
    },
  };
}
