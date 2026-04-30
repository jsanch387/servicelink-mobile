import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useTheme } from '../../../../theme';
import { customersListQueryKey } from '../../../customers/queryKeys';
import { homeBookingsTodayQueryKey, homeBookingsUpcomingQueryKey } from '../../../home/queryKeys';
import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import { insertOwnerBooking } from '../api/insertOwnerBooking';
import {
  CREATE_APPOINTMENT_LAST_STEP,
  CREATE_APPOINTMENT_STEP,
  CREATE_APPOINTMENT_STEP_META,
  createAppointmentStepShowsMainTitle,
  createEmptyAddressForm,
  createEmptyCustomerForm,
  createEmptyVehicleForm,
} from '../constants';
import { buildOwnerBookingInsertPayload } from '../utils/buildOwnerBookingPayload';
import { canContinueCreateAppointmentStep } from '../utils/createFlowContinueGate';
import {
  baseServiceDurationMinutes,
  totalBookingDurationMinutes,
} from '../utils/createFlowDuration';
import { getNextStepOnContinue, getPreviousStepOnBack } from '../utils/createFlowNavigation';
import {
  buildCreateFlowPricingOptions,
  getSelectedCreateFlowPricingOption,
} from '../utils/createFlowPricing';
import { parseAvailabilityForSchedule } from '../utils/createFlowAvailability';
import {
  computeTimeSlotsForDateKey,
  createIsDateUnavailablePredicate,
} from '../utils/createFlowSlots';
import { createAppointmentFlowStyles } from '../styles/createAppointmentFlowStyles';
import { useCreateAppointmentServerData } from './useCreateAppointmentServerData';

/**
 * All wizard state, server data, scheduling, save mutation, and navigation for create appointment.
 *
 * @param {object} args
 * @param {object} args.catalog result of {@link useServicesCatalog}
 * @param {string | undefined} args.userId auth user id
 * @param {object} args.navigation React Navigation object with `goBack`
 */
export function useCreateAppointmentController({ catalog, userId, navigation }) {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(CREATE_APPOINTMENT_STEP.SERVICE);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedPricingId, setSelectedPricingId] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customer, setCustomer] = useState(createEmptyCustomerForm);
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

  const pricingPayload = useMemo(
    () =>
      buildCreateFlowPricingOptions(selectedServiceRow, server.priceOptionRows, server.ownerHasPro),
    [selectedServiceRow, server.priceOptionRows, server.ownerHasPro],
  );

  const selectedPricingOption = useMemo(
    () => getSelectedCreateFlowPricingOption(pricingPayload.options, selectedPricingId),
    [pricingPayload.options, selectedPricingId],
  );

  useEffect(() => {
    if (step !== CREATE_APPOINTMENT_STEP.PRICING) return;
    const opts = pricingPayload.options;
    if (opts.length === 1 && !selectedPricingId) {
      setSelectedPricingId(opts[0].id);
    }
  }, [step, pricingPayload.options, selectedPricingId]);

  const { acceptBookings, weeklySchedule, timeOffBlocks } = useMemo(
    () => parseAvailabilityForSchedule(server.availabilityRow),
    [server.availabilityRow],
  );

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

  const scheduleCtx = useMemo(
    () => ({
      acceptBookings,
      weeklySchedule,
      totalDurationMinutes,
      blockingBookingRows: server.blockingBookingRows,
      timeOffBlocks,
    }),
    [
      acceptBookings,
      weeklySchedule,
      totalDurationMinutes,
      server.blockingBookingRows,
      timeOffBlocks,
    ],
  );

  const timeSlots = useMemo(
    () => computeTimeSlotsForDateKey(selectedDateKey, scheduleCtx),
    [selectedDateKey, scheduleCtx],
  );

  const isDateUnavailable = useMemo(
    () => createIsDateUnavailablePredicate(scheduleCtx),
    [scheduleCtx],
  );

  const scheduleLoading =
    server.availabilityLoading || server.blockingLoading || server.priceOptionsLoading;
  const scheduleError =
    server.availabilityError || server.blockingError || server.priceOptionsError || null;

  useEffect(() => {
    if (!selectedDateKey || !selectedTime || scheduleLoading) return;
    if (timeSlots.length > 0 && !timeSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [selectedDateKey, selectedTime, timeSlots, scheduleLoading]);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await insertOwnerBooking(
        buildOwnerBookingInsertPayload({
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
        }),
      );

      if (error) {
        throw new Error(error.message ?? 'Could not create booking');
      }
      if (!data?.id) {
        throw new Error('Could not create booking');
      }
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: homeBookingsUpcomingQueryKey(catalog.businessId),
        }),
        queryClient.invalidateQueries({
          queryKey: homeBookingsTodayQueryKey(catalog.businessId),
        }),
        queryClient.invalidateQueries({
          queryKey: customersListQueryKey(catalog.businessId),
        }),
      ]);
      setAppointmentConfirmed(true);
    },
    onError: (e) => {
      Alert.alert('Could not create booking', e?.message ?? 'Try again.');
    },
  });

  const addonCatalogKnown = !catalog.isLoading && !catalogError;
  const addonsCount = addonsForSelectedService.length;

  useEffect(() => {
    if (!addonCatalogKnown) return;
    if (step === CREATE_APPOINTMENT_STEP.ADDONS && addonsCount === 0) {
      setStep(CREATE_APPOINTMENT_STEP.SCHEDULE);
    }
  }, [addonCatalogKnown, addonsCount, step]);

  const canContinue = useMemo(
    () =>
      canContinueCreateAppointmentStep({
        appointmentConfirmed,
        step,
        selectedServiceId,
        selectedPricingId,
        acceptBookings,
        scheduleLoading,
        selectedDateKey,
        selectedTime,
        timeSlots,
        customer,
        address,
        vehicle,
      }),
    [
      appointmentConfirmed,
      step,
      selectedServiceId,
      selectedPricingId,
      acceptBookings,
      scheduleLoading,
      selectedDateKey,
      selectedTime,
      timeSlots,
      customer,
      address,
      vehicle,
    ],
  );

  const progressPercent = useMemo(() => {
    if (appointmentConfirmed) return 100;
    return ((step + 1) / CREATE_APPOINTMENT_STEP_META.length) * 100;
  }, [appointmentConfirmed, step]);

  const meta = CREATE_APPOINTMENT_STEP_META[step];

  const handleBack = useCallback(() => {
    if (appointmentConfirmed) {
      navigation.goBack();
      return;
    }
    if (step > CREATE_APPOINTMENT_STEP.SERVICE) {
      setStep(
        getPreviousStepOnBack({
          step,
          addonCatalogKnown,
          addonsCount,
        }),
      );
      return;
    }
    navigation.goBack();
  }, [addonCatalogKnown, addonsCount, appointmentConfirmed, navigation, step]);

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
        addonCatalogKnown,
        addonsCount,
      }),
    );
  }, [
    addonCatalogKnown,
    addonsCount,
    appointmentConfirmed,
    canContinue,
    createBookingMutation,
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
      selectedServiceId,
      onSelectServiceId: setSelectedServiceId,
      pricingOptions: pricingPayload.options,
      selectedPricingId,
      selectedService,
      onSelectPricingId: setSelectedPricingId,
      selectedAddonIds,
      selectedPricingOption,
      addonsForSelectedService,
      onToggleAddon: toggleAddon,
      acceptBookings,
      isDateUnavailable,
      scheduleError,
      scheduleLoading,
      selectedDateKey,
      selectedTime,
      timeSlots,
      onSelectDateKey: setSelectedDateKey,
      onSelectTime: setSelectedTime,
      customer,
      onChangeCustomer: setCustomer,
      address,
      onChangeAddress: setAddress,
      vehicle,
      notes,
      onChangeVehicle: setVehicle,
      onChangeNotes: setNotes,
    }),
    [
      step,
      appointmentConfirmed,
      catalogError,
      catalog.isLoading,
      enabledServices,
      selectedServiceId,
      pricingPayload.options,
      selectedPricingId,
      selectedService,
      selectedAddonIds,
      selectedPricingOption,
      addonsForSelectedService,
      toggleAddon,
      acceptBookings,
      isDateUnavailable,
      scheduleError,
      scheduleLoading,
      selectedDateKey,
      selectedTime,
      timeSlots,
      customer,
      address,
      vehicle,
      notes,
    ],
  );

  return {
    styles,
    progressPercent,
    appointmentConfirmed,
    showMainTitle: createAppointmentStepShowsMainTitle(step) && !appointmentConfirmed,
    mainTitle: meta?.title ?? '',
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
