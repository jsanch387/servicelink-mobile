import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../../../components/ui';
import { safeUserFacingMessage } from '../../../../utils/safeUserFacingMessage';
import { useTheme } from '../../../../theme';
import { invalidateBookingCachesAfterMutation } from '../../booking-details/utils/invalidateBookingCachesAfterMutation';
import { updateBookingById } from '../api/updateBookingById';
import { syncBookingPaymentTotalsAfterEdit } from '../api/syncBookingPaymentTotalsAfterEdit';
import { buildEditBookingUpdatePayload } from '../utils/buildEditBookingUpdatePayload';
import { resolveBookingDiscount } from '../../booking-details/utils/resolveBookingDiscount';
import {
  parsePriceLabelToUsd,
  formatUsdFromNumber,
} from '../../create-appointment/utils/priceLabelMath';
import { splitBookingServiceName } from '../../../../utils/splitBookingServiceName';
import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import { useCreateAppointmentServerData } from '../../create-appointment/hooks/useCreateAppointmentServerData';
import { createAppointmentFlowStyles } from '../../create-appointment/styles/createAppointmentFlowStyles';
import {
  baseServiceDurationMinutes,
  totalBookingDurationMinutes,
} from '../../create-appointment/utils/createFlowDuration';
import {
  getCreateAppointmentProgressFraction,
  isAddonsStepSkipped,
} from '../../create-appointment/utils/createFlowNavigation';
import {
  buildCreateFlowPricingOptions,
  getSelectedCreateFlowPricingOption,
  isCreateFlowPricingSelectionValid,
  isServicePriceTiersEnabled,
  shouldSkipCreateFlowPricingStep,
} from '../../create-appointment/utils/createFlowPricing';
import {
  isAddressStepComplete,
  isReviewStepComplete,
  isReviewVisitFieldsComplete,
  isVehicleStepComplete,
  parseRequiredCustomJobPriceCents,
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
import { CREATE_APPOINTMENT_CUSTOM_JOB_ID } from '../../create-appointment/constants';
import { serviceDurationHHmmToMinutes } from '../../../../components/ui/durationTime';
import {
  EDIT_APPOINTMENT_ADDONS_ENTRY,
  EDIT_APPOINTMENT_ADDONS_JOBS_LIST,
  EDIT_APPOINTMENT_HUB,
  EDIT_APPOINTMENT_JOB_HUB,
  EDIT_APPOINTMENT_JOBS_LIST,
  EDIT_APPOINTMENT_LAST_STEP,
  EDIT_APPOINTMENT_NOTES,
  EDIT_APPOINTMENT_STEP,
  EDIT_APPOINTMENT_STEP_META,
  createEmptyAddressForm,
  createEmptyCustomerForm,
  createEmptyVehicleForm,
  editAppointmentStepShowsMainTitle,
} from '../constants';
import { buildEditHubSections } from '../utils/buildEditHubSections';
import { buildEditJobHubSections } from '../utils/buildEditJobHubSections';
import {
  draftFieldsFromEditJob,
  flushEditDraftToJobSnapshot,
  isEditJobCustom,
  mergeActiveJobIntoJobs,
  resolvePricingIdFromLabelHint,
} from '../utils/editJobDraft';
import {
  isMultiJobEdit,
  mapBookingJobsForEdit,
  sumEditJobsDurationMinutes,
} from '../utils/mapBookingJobsForEdit';
import {
  bookingHasStoredAddons,
  mapBookingToEditAppointmentForm,
  matchCatalogServiceIdByName,
  resolveEditAppointmentAddonIds,
  resolveEditAppointmentPricingId,
} from '../utils/mapBookingToEditAppointmentForm';

function centsToUsdText(cents) {
  const n = Math.max(0, Math.round(Number(cents) || 0)) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

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
  const toast = useToast();
  const prefillAppliedRef = useRef(false);
  const skipServiceResetRef = useRef(false);
  const skipDateResetRef = useRef(false);
  const schedulePrefillSyncedRef = useRef(false);
  const pricingPrefillSyncedRef = useRef(false);
  const addonsPrefillSyncedRef = useRef(false);
  /** @type {React.MutableRefObject<'hub' | 'addons_list'>} */
  const addonsReturnTargetRef = useRef('hub');
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
  const [jobs, setJobs] = useState(
    /** @type {import('../utils/mapBookingJobsForEdit').EditJobSnapshot[]} */ ([]),
  );
  const [activeJobIndex, setActiveJobIndex] = useState(/** @type {number | null} */ (null));
  const [customServiceName, setCustomServiceName] = useState('');
  const [customPriceUsdText, setCustomPriceUsdText] = useState('');
  const [customDurationHhMm, setCustomDurationHhMm] = useState('01:00');
  const [catalogPriceUsdText, setCatalogPriceUsdText] = useState('');
  const [pricingLabelHint, setPricingLabelHint] = useState(/** @type {string | null} */ (null));
  const jobPricingHydrateRef = useRef(false);
  /** Only auto-advance SERVICE → PRICING after the user picks a service (not when Back-ing). */
  const advanceToPricingAfterServiceRef = useRef(false);
  /** True when pricing was opened from a service pick (Back should return to SERVICE). */
  const pricingEnteredFromServiceRef = useRef(false);

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
    setJobs([]);
    setActiveJobIndex(null);
    setPricingLabelHint(null);
  }, [bookingId]);

  const isCustomJob = selectedServiceId === CREATE_APPOINTMENT_CUSTOM_JOB_ID;
  const customPriceRaw = String(customPriceUsdText ?? '')
    .replace(/\$/g, '')
    .trim();
  const customPriceCents = (() => {
    const parsed = parseRequiredCustomJobPriceCents(customPriceRaw);
    return parsed == null ? NaN : parsed;
  })();
  const customDurationMinutes = serviceDurationHHmmToMinutes(customDurationHhMm);
  const customJobComplete = Boolean(
    String(customServiceName ?? '').trim() &&
    Number.isFinite(customPriceCents) &&
    customPriceCents >= 0 &&
    customDurationMinutes > 0,
  );
  const customPriceLabel = Number.isFinite(customPriceCents)
    ? formatUsdFromNumber(customPriceCents / 100)
    : '$0.00';

  const catalogPriceRaw = String(catalogPriceUsdText ?? '')
    .replace(/\$/g, '')
    .trim();
  const parsedCatalogPriceCents = parseRequiredCustomJobPriceCents(catalogPriceRaw);

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
    setCatalogPriceUsdText('');
    setPricingLabelHint(null);
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
    () =>
      isCustomJob
        ? []
        : catalogAddonsForService(selectedServiceId, catalog.addons, catalog.addonAssignments),
    [selectedServiceId, catalog.addons, catalog.addonAssignments, isCustomJob],
  );

  const server = useCreateAppointmentServerData({
    businessId: catalog.businessId,
    userId,
    selectedServiceId: isCustomJob ? null : (selectedServiceId ?? bookingServiceIdForPrefill),
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

  const selectedPricingOptionBase = useMemo(() => {
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

  const selectedPricingOption = useMemo(() => {
    if (!selectedPricingOptionBase || isCustomJob) return selectedPricingOptionBase;
    if (parsedCatalogPriceCents == null) return selectedPricingOptionBase;
    return {
      ...selectedPricingOptionBase,
      priceCents: parsedCatalogPriceCents,
      priceLabel: formatUsdFromNumber(parsedCatalogPriceCents / 100),
    };
  }, [isCustomJob, parsedCatalogPriceCents, selectedPricingOptionBase]);

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
    if (jobPricingHydrateRef.current) return;
    setSelectedPricingId(opts[0].id);
  }, [
    needsTieredPricingRows,
    pricingPayload.options,
    priceOptionsEnabled,
    selectedPricingId,
    server.priceOptionsLoading,
  ]);

  /** Keep editable catalog price in sync with the selected tier when it is empty. */
  useEffect(() => {
    if (isCustomJob || !selectedPricingOptionBase) return;
    if (catalogPriceRaw.length > 0) return;
    setCatalogPriceUsdText(centsToUsdText(selectedPricingOptionBase.priceCents));
  }, [catalogPriceRaw.length, isCustomJob, selectedPricingOptionBase]);

  const handleSelectPricingId = useCallback(
    (id) => {
      setSelectedPricingId(id);
      const option = pricingPayload.options.find((o) => o.id === id);
      if (option) {
        setCatalogPriceUsdText(centsToUsdText(option.priceCents));
      }
    },
    [pricingPayload.options],
  );

  /** When opening a multi-job row, match tier by stored label once options are ready. */
  useEffect(() => {
    if (!jobPricingHydrateRef.current || isCustomJob) return;
    if (server.priceOptionsLoading) return;
    const opts = pricingPayload.options;
    if (!opts.length) return;
    const resolved = resolvePricingIdFromLabelHint(opts, pricingLabelHint, selectedPricingId);
    if (resolved && resolved !== selectedPricingId) {
      setSelectedPricingId(resolved);
    }
    jobPricingHydrateRef.current = false;
    setPricingLabelHint(null);
  }, [
    isCustomJob,
    pricingLabelHint,
    pricingPayload.options,
    selectedPricingId,
    server.priceOptionsLoading,
  ]);

  const selectedAddonRows = useMemo(() => {
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    return addonsForSelectedService.filter((a) => idSet.has(String(a.id)));
  }, [addonsForSelectedService, selectedAddonIds]);

  const isMultiJob = isMultiJobEdit(jobs);

  const currentJobDurationMinutes = useMemo(
    () =>
      totalBookingDurationMinutes(
        baseServiceDurationMinutes(selectedServiceRow, selectedPricingOption, selectedService),
        isCustomJob ? [] : selectedAddonRows,
      ),
    [selectedServiceRow, selectedPricingOption, selectedService, selectedAddonRows, isCustomJob],
  );

  const totalDurationMinutes = useMemo(() => {
    if (activeJobIndex != null || (Array.isArray(jobs) && jobs.length > 1)) {
      const withDraft =
        activeJobIndex != null
          ? mergeActiveJobIntoJobs(
              jobs,
              activeJobIndex,
              flushEditDraftToJobSnapshot({
                localId: jobs[activeJobIndex]?.localId,
                isCustomJob,
                selectedServiceId,
                selectedService,
                selectedPricingOption,
                selectedAddonRows,
                totalDurationMinutes: currentJobDurationMinutes,
                vehicle,
                selectedPricingId,
                selectedAddonIds,
                catalogPriceUsdText,
                customServiceName,
                customPriceUsdText,
                customDurationHhMm,
              }),
            )
          : jobs;
      return Math.max(15, sumEditJobsDurationMinutes(withDraft));
    }
    return currentJobDurationMinutes;
  }, [
    activeJobIndex,
    currentJobDurationMinutes,
    jobs,
    isCustomJob,
    selectedServiceId,
    selectedService,
    selectedPricingOption,
    selectedAddonRows,
    vehicle,
    selectedPricingId,
    selectedAddonIds,
    catalogPriceUsdText,
    customServiceName,
    customPriceUsdText,
    customDurationHhMm,
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
    onSelectDateKey: handleSelectDateKey,
    onSelectTime: setSelectedTime,
    scheduleLoading,
    ownerManualBooking: true,
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
    setJobs(mapBookingJobsForEdit(booking));
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
    const bookingHasAddons = bookingHasStoredAddons(booking);
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
    () => isCustomJob || isAddonsStepSkipped(addonCatalogKnown, addonsCount),
    [addonCatalogKnown, addonsCount, isCustomJob],
  );

  useEffect(() => {
    if (!addonCatalogKnown) return;
    if (step !== EDIT_APPOINTMENT_STEP.ADDONS || !addonsSkipped) return;
    const returnTo = addonsReturnTargetRef.current;
    addonsReturnTargetRef.current = 'hub';
    setActiveJobIndex(null);
    if (returnTo === 'addons_list') {
      setStep(EDIT_APPOINTMENT_ADDONS_JOBS_LIST);
      return;
    }
    setStep(EDIT_APPOINTMENT_HUB);
  }, [addonCatalogKnown, addonsSkipped, step]);

  useEffect(() => {
    if (step !== EDIT_APPOINTMENT_STEP.PRICING || !pricingSkipped) return;
    if (isCustomJob) return;
    if (activeJobIndex != null) {
      setStep(EDIT_APPOINTMENT_JOB_HUB);
      return;
    }
    setStep(EDIT_APPOINTMENT_HUB);
  }, [step, pricingSkipped, activeJobIndex, isCustomJob]);

  /**
   * Service & pricing are one path: picking a multi-tier service advances to pricing
   * so Save can't persist a $0 job without a tier. Only runs after an explicit pick.
   */
  useEffect(() => {
    if (step !== EDIT_APPOINTMENT_STEP.SERVICE) return;
    if (!advanceToPricingAfterServiceRef.current) return;
    if (isCustomJob || !selectedServiceId) return;
    if (priceOptionsEnabled && server.priceOptionsLoading) return;
    if (pricingSkipped) {
      advanceToPricingAfterServiceRef.current = false;
      return;
    }
    advanceToPricingAfterServiceRef.current = false;
    pricingEnteredFromServiceRef.current = true;
    setStep(EDIT_APPOINTMENT_STEP.PRICING);
  }, [
    step,
    isCustomJob,
    selectedServiceId,
    priceOptionsEnabled,
    server.priceOptionsLoading,
    pricingSkipped,
  ]);

  const handleSelectServiceId = useCallback((id) => {
    advanceToPricingAfterServiceRef.current = true;
    setSelectedServiceId(id);
  }, []);

  const jobsForSave = useMemo(() => {
    const draftSnapshot = flushEditDraftToJobSnapshot({
      localId: activeJobIndex != null ? jobs[activeJobIndex]?.localId : jobs[0]?.localId,
      isCustomJob,
      selectedServiceId,
      selectedService,
      selectedPricingOption,
      selectedAddonRows,
      totalDurationMinutes: currentJobDurationMinutes,
      vehicle,
      selectedPricingId,
      selectedAddonIds,
      catalogPriceUsdText,
      customServiceName,
      customPriceUsdText,
      customDurationHhMm,
    });

    // Merge open job draft into the jobs array (single- or multi-job).
    if (activeJobIndex != null) {
      return mergeActiveJobIntoJobs(jobs, activeJobIndex, draftSnapshot);
    }

    // Single-job visit hub: keep draft fields (service / add-ons / vehicle) on jobs[0]
    // so save still writes job_details even if the job mini-hub wasn't re-opened.
    if (Array.isArray(jobs) && jobs.length === 1) {
      return [draftSnapshot];
    }

    return jobs;
  }, [
    jobs,
    activeJobIndex,
    isCustomJob,
    selectedServiceId,
    selectedService,
    selectedPricingOption,
    selectedAddonRows,
    currentJobDurationMinutes,
    vehicle,
    selectedPricingId,
    selectedAddonIds,
    catalogPriceUsdText,
    customServiceName,
    customPriceUsdText,
    customDurationHhMm,
  ]);

  const canSave = useMemo(() => {
    const visitOk = isReviewVisitFieldsComplete({
      selectedDateKey,
      selectedTime,
      customer,
      appointmentLocationType,
      locationSkipped,
      addressSkipped,
      address,
    });
    if (!visitOk) return false;

    if (Array.isArray(jobsForSave) && jobsForSave.length > 0) {
      const jobsOk = jobsForSave.every((job) => {
        if (!String(job.serviceName ?? '').trim()) return false;
        if (!isVehicleStepComplete(job.vehicle)) return false;
        // Catalog jobs need a resolved pricing option (avoids saving $0 after a service change).
        if (job.isCustomJob || !job.selectedServiceId) return true;
        return job.selectedPricingOption != null;
      });
      if (!jobsOk) return false;

      if (activeJobIndex != null && !isCustomJob && !pricingSkipped) {
        return isCreateFlowPricingSelectionValid({
          selectedPricingId,
          pricingOptions: pricingPayload.options,
          priceOptionsLoading: server.priceOptionsLoading,
          priceOptionsEnabled,
        });
      }
      return true;
    }

    if (isCustomJob) {
      return customJobComplete && isVehicleStepComplete(vehicle);
    }

    return isReviewStepComplete({
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
      addressSkipped,
      address,
      vehicle,
    });
  }, [
    selectedDateKey,
    selectedTime,
    customer,
    appointmentLocationType,
    locationSkipped,
    addressSkipped,
    address,
    jobsForSave,
    activeJobIndex,
    isCustomJob,
    pricingSkipped,
    selectedPricingId,
    pricingPayload.options,
    server.priceOptionsLoading,
    priceOptionsEnabled,
    customJobComplete,
    vehicle,
    selectedServiceId,
  ]);

  const isHubView = step === EDIT_APPOINTMENT_HUB;
  const isJobsListView = step === EDIT_APPOINTMENT_JOBS_LIST;
  const isAddonsJobsListView = step === EDIT_APPOINTMENT_ADDONS_JOBS_LIST;
  const isJobHubView = step === EDIT_APPOINTMENT_JOB_HUB;
  const isNotesView = step === EDIT_APPOINTMENT_NOTES;
  const isJobScopedStep =
    activeJobIndex != null &&
    (step === EDIT_APPOINTMENT_STEP.SERVICE ||
      step === EDIT_APPOINTMENT_STEP.PRICING ||
      step === EDIT_APPOINTMENT_STEP.ADDONS ||
      step === EDIT_APPOINTMENT_STEP.VEHICLE);

  const showAddonsSection = useMemo(
    () => (jobs ?? []).some((job) => !isEditJobCustom(job)),
    [jobs],
  );

  const hubSections = useMemo(
    () =>
      buildEditHubSections({
        jobs,
        showAddonsSection,
        locationSkipped,
        addressSkipped,
        selectedDateKey,
        selectedTime,
        customer,
        appointmentLocationType,
        address,
        notes,
      }),
    [
      jobs,
      showAddonsSection,
      locationSkipped,
      addressSkipped,
      selectedDateKey,
      selectedTime,
      customer,
      appointmentLocationType,
      address,
      notes,
    ],
  );

  const activeJobTitle =
    activeJobIndex != null
      ? String(jobs[activeJobIndex]?.serviceName ?? selectedService?.name ?? '').trim()
      : '';

  const jobHubSections = useMemo(
    () =>
      buildEditJobHubSections({
        jobTitle: activeJobTitle,
        isCustomJob,
        pricingSkipped,
        selectedServiceId,
        selectedService,
        vehicle,
      }),
    [activeJobTitle, isCustomJob, pricingSkipped, selectedServiceId, selectedService, vehicle],
  );

  const applyJobDraftFields = useCallback((job) => {
    if (!job) return;
    const draft = draftFieldsFromEditJob(job);
    skipServiceResetRef.current = true;
    jobPricingHydrateRef.current = !isEditJobCustom(job);
    setSelectedServiceId(draft.selectedServiceId);
    setSelectedPricingId(draft.selectedPricingId);
    setSelectedAddonIds(draft.selectedAddonIds);
    setVehicle(draft.vehicle);
    setCatalogPriceUsdText(draft.catalogPriceUsdText);
    setCustomServiceName(draft.customServiceName);
    setCustomPriceUsdText(draft.customPriceUsdText);
    setCustomDurationHhMm(draft.customDurationHhMm);
    setPricingLabelHint(draft.pricingOptionLabelHint || null);
  }, []);

  const restoreActiveJobDraft = useCallback(() => {
    if (activeJobIndex == null) return;
    applyJobDraftFields(jobs[activeJobIndex]);
  }, [activeJobIndex, jobs, applyJobDraftFields]);

  const sectionSnapshotRef = useRef(
    /** @type {null | {
     *   customer: ReturnType<typeof createEmptyCustomerForm>;
     *   address: ReturnType<typeof createEmptyAddressForm>;
     *   notes: string;
     *   selectedDateKey: string | null;
     *   selectedTime: string | null;
     *   vehicle: ReturnType<typeof createEmptyVehicleForm>;
     *   appointmentLocationType: 'mobile' | 'shop' | null;
     * }} */ (null),
  );

  const captureVisitSectionSnapshot = useCallback(() => {
    sectionSnapshotRef.current = {
      customer: { ...customer },
      address: { ...address },
      notes,
      selectedDateKey,
      selectedTime,
      vehicle: { ...vehicle },
      appointmentLocationType,
    };
  }, [customer, address, notes, selectedDateKey, selectedTime, vehicle, appointmentLocationType]);

  const restoreVisitSectionSnapshot = useCallback(() => {
    const snap = sectionSnapshotRef.current;
    if (!snap) return;
    setCustomer(snap.customer);
    setAddress(snap.address);
    setNotes(snap.notes);
    setSelectedDateKey(snap.selectedDateKey);
    setSelectedTime(snap.selectedTime);
    setVehicle(snap.vehicle);
    setAppointmentLocationType(snap.appointmentLocationType);
    sectionSnapshotRef.current = null;
  }, []);

  const openEditSection = useCallback(
    (targetStep) => {
      if (step === EDIT_APPOINTMENT_HUB) {
        captureVisitSectionSnapshot();
      }

      if (targetStep === EDIT_APPOINTMENT_ADDONS_ENTRY) {
        const catalogJobIndexes = (jobs ?? [])
          .map((job, index) => ({ job, index }))
          .filter(({ job }) => !isEditJobCustom(job))
          .map(({ index }) => index);
        if (catalogJobIndexes.length === 0) {
          return;
        }
        if (catalogJobIndexes.length === 1) {
          const index = catalogJobIndexes[0];
          const job = jobs[index];
          setActiveJobIndex(index);
          applyJobDraftFields(job);
          addonsReturnTargetRef.current = 'hub';
          setStep(EDIT_APPOINTMENT_STEP.ADDONS);
          return;
        }
        addonsReturnTargetRef.current = 'hub';
        setStep(EDIT_APPOINTMENT_ADDONS_JOBS_LIST);
        return;
      }

      if (targetStep === EDIT_APPOINTMENT_STEP.PRICING && activeJobIndex != null && !isCustomJob) {
        pricingEnteredFromServiceRef.current = true;
      }
      setStep(targetStep);
    },
    [step, captureVisitSectionSnapshot, activeJobIndex, isCustomJob, jobs, applyJobDraftFields],
  );

  const openJobForEdit = useCallback(
    (index) => {
      const job = jobs[index];
      if (!job) return;
      setActiveJobIndex(index);
      applyJobDraftFields(job);
      setStep(EDIT_APPOINTMENT_JOB_HUB);
    },
    [jobs, applyJobDraftFields],
  );

  const openJobForAddons = useCallback(
    (index) => {
      const job = jobs[index];
      if (!job || isEditJobCustom(job)) return;
      setActiveJobIndex(index);
      applyJobDraftFields(job);
      addonsReturnTargetRef.current = 'addons_list';
      setStep(EDIT_APPOINTMENT_STEP.ADDONS);
    },
    [jobs, applyJobDraftFields],
  );

  const returnToHub = useCallback(() => {
    restoreVisitSectionSnapshot();
    setActiveJobIndex(null);
    addonsReturnTargetRef.current = 'hub';
    setStep(EDIT_APPOINTMENT_HUB);
  }, [restoreVisitSectionSnapshot]);

  const returnToJobHub = useCallback(() => {
    restoreActiveJobDraft();
    setStep(EDIT_APPOINTMENT_JOB_HUB);
  }, [restoreActiveJobDraft]);

  const returnToJobsList = useCallback(() => {
    setActiveJobIndex(null);
    setStep(EDIT_APPOINTMENT_JOBS_LIST);
  }, []);

  const returnFromAddonsStep = useCallback(() => {
    restoreActiveJobDraft();
    const returnTo = addonsReturnTargetRef.current;
    addonsReturnTargetRef.current = 'hub';
    setActiveJobIndex(null);
    if (returnTo === 'addons_list') {
      setStep(EDIT_APPOINTMENT_ADDONS_JOBS_LIST);
      return;
    }
    setStep(EDIT_APPOINTMENT_HUB);
  }, [restoreActiveJobDraft]);

  const progressPercent = useMemo(
    () =>
      isHubView || isJobsListView || isAddonsJobsListView || isJobHubView || isNotesView
        ? 0
        : getCreateAppointmentProgressFraction(step, {
            appointmentConfirmed: false,
            pricingSkipped,
            addonsSkipped,
            locationSkipped,
            addressSkipped,
          }) * 100,
    [
      isHubView,
      isJobsListView,
      isAddonsJobsListView,
      isJobHubView,
      isNotesView,
      step,
      pricingSkipped,
      addonsSkipped,
      locationSkipped,
      addressSkipped,
    ],
  );

  const meta =
    isHubView || isJobsListView || isAddonsJobsListView || isJobHubView || isNotesView
      ? null
      : EDIT_APPOINTMENT_STEP_META[step];
  const addressStepCopy = useMemo(
    () => getCreateAppointmentAddressStepCopy(appointmentLocationType),
    [appointmentLocationType],
  );
  const mainTitle = useMemo(() => {
    if (isNotesView) return 'Notes';
    if (step === EDIT_APPOINTMENT_STEP.ADDRESS) return addressStepCopy.title;
    if (isJobScopedStep && step === EDIT_APPOINTMENT_STEP.VEHICLE) return 'Vehicle';
    return meta?.title ?? '';
  }, [isNotesView, step, addressStepCopy.title, isJobScopedStep, meta?.title]);
  const mainSubtitle = useMemo(() => {
    if (isNotesView) return 'Visit notes for this appointment.';
    if (step === EDIT_APPOINTMENT_STEP.ADDRESS) return addressStepCopy.subtitle;
    if (isJobScopedStep && step === EDIT_APPOINTMENT_STEP.VEHICLE) {
      return 'Vehicle for this job — or leave blank.';
    }
    return meta?.subtitle ?? '';
  }, [isNotesView, step, addressStepCopy.subtitle, isJobScopedStep, meta?.subtitle]);

  const updateBookingMutation = useMutation({
    mutationFn: async () => {
      if (!bookingId) {
        throw new Error('Missing booking');
      }
      const jobsSnapshot =
        Array.isArray(jobsForSave) && jobsForSave.length > 0 ? jobsForSave : null;
      const payload = buildEditBookingUpdatePayload({
        selectedService,
        selectedServiceId: isCustomJob ? null : selectedServiceId,
        selectedPricingOption,
        selectedAddonRows,
        totalDurationMinutes:
          Array.isArray(jobsForSave) && jobsForSave.length > 0
            ? sumEditJobsDurationMinutes(jobsForSave)
            : currentJobDurationMinutes,
        selectedDateKey,
        selectedTime,
        customer,
        address,
        vehicle,
        notes,
        appointmentLocationType,
        isMultiJob,
        jobs: jobsSnapshot,
      });
      const { data, error } = await updateBookingById(bookingId, payload, catalog.businessId);
      if (error) {
        throw new Error(error.message ?? 'Could not save changes');
      }
      if (!data) {
        throw new Error('Could not save changes');
      }

      const visitGrossCents =
        Array.isArray(jobsForSave) && jobsForSave.length > 0
          ? jobsForSave.reduce((sum, job) => {
              const serviceCents = Math.max(
                0,
                Math.round(Number(job.selectedPricingOption?.priceCents) || 0),
              );
              const addonCents = (job.selectedAddonRows ?? []).reduce((addonSum, addon) => {
                if (addon?.priceCents != null && Number.isFinite(Number(addon.priceCents))) {
                  return addonSum + Math.max(0, Math.round(Number(addon.priceCents)));
                }
                return addonSum + Math.round(parsePriceLabelToUsd(addon?.priceLabel) * 100);
              }, 0);
              return sum + serviceCents + addonCents;
            }, 0)
          : Math.max(0, Math.round(Number(selectedPricingOption?.priceCents) || 0)) +
            (selectedAddonRows ?? []).reduce((addonSum, addon) => {
              if (addon?.priceCents != null && Number.isFinite(Number(addon.priceCents))) {
                return addonSum + Math.max(0, Math.round(Number(addon.priceCents)));
              }
              return addonSum + Math.round(parsePriceLabelToUsd(addon?.priceLabel) * 100);
            }, 0);

      const discountCents = resolveBookingDiscount(booking)?.discountCents ?? 0;
      const visitNetCents = Math.max(0, visitGrossCents - discountCents);
      const { error: paymentError } = await syncBookingPaymentTotalsAfterEdit(
        bookingId,
        visitNetCents,
        catalog.businessId,
      );
      if (paymentError) {
        throw new Error(paymentError.message ?? 'Could not update payment total');
      }

      return { data, jobsSnapshot };
    },
    onSuccess: async (result) => {
      sectionSnapshotRef.current = null;
      if (result?.jobsSnapshot) {
        setJobs(result.jobsSnapshot);
      }
      setActiveJobIndex(null);
      // Stay in edit — hub so they can change another section without re-opening.
      setStep(EDIT_APPOINTMENT_HUB);
      await invalidateBookingCachesAfterMutation(queryClient, bookingId);
      toast.success('Changes saved');
    },
    onError: (e) => {
      toast.error(safeUserFacingMessage(e, { fallback: 'Could not save changes. Try again.' }));
    },
  });

  const handleBack = useCallback(() => {
    if (isHubView) {
      navigation.goBack();
      return;
    }
    if (isJobsListView || isAddonsJobsListView) {
      setStep(EDIT_APPOINTMENT_HUB);
      return;
    }
    if (isJobHubView) {
      returnToJobsList();
      return;
    }
    if (isNotesView) {
      returnToHub();
      return;
    }
    // Combined Service → Pricing path: Back returns to the service list (not trapped by auto-advance).
    if (
      step === EDIT_APPOINTMENT_STEP.PRICING &&
      !isCustomJob &&
      (activeJobIndex != null || pricingEnteredFromServiceRef.current)
    ) {
      pricingEnteredFromServiceRef.current = false;
      advanceToPricingAfterServiceRef.current = false;
      setStep(EDIT_APPOINTMENT_STEP.SERVICE);
      return;
    }
    if (step === EDIT_APPOINTMENT_STEP.ADDONS && activeJobIndex != null) {
      returnFromAddonsStep();
      return;
    }
    if (isJobScopedStep) {
      returnToJobHub();
      return;
    }
    returnToHub();
  }, [
    isHubView,
    isJobsListView,
    isAddonsJobsListView,
    isJobHubView,
    isNotesView,
    isJobScopedStep,
    step,
    isCustomJob,
    activeJobIndex,
    navigation,
    returnToJobsList,
    returnToJobHub,
    returnToHub,
    returnFromAddonsStep,
  ]);

  const handleSave = useCallback(() => {
    if (!canSave || updateBookingMutation.isPending) return;
    updateBookingMutation.mutate();
  }, [canSave, updateBookingMutation]);

  const handleContinue = useCallback(() => {
    // Jobs / add-ons job lists are navigation-only (Done → hub).
    if (isJobsListView || isAddonsJobsListView) {
      setStep(EDIT_APPOINTMENT_HUB);
      return;
    }
    handleSave();
  }, [handleSave, isJobsListView, isAddonsJobsListView]);

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
      servicePickPhase: 'catalog',
      isCustomJob,
      selectedServiceId,
      onSelectServiceId: handleSelectServiceId,
      onChooseServices: () => {},
      onChooseCustomJob: () => {},
      customServiceName,
      customPriceUsdText,
      customDurationHhMm,
      onCustomServiceNameChange: setCustomServiceName,
      onCustomPriceUsdTextChange: setCustomPriceUsdText,
      onCustomDurationHhMmChange: setCustomDurationHhMm,
      pricingOptions: pricingPayload.options,
      priceOptionsLoading: server.priceOptionsLoading,
      selectedPricingId,
      selectedService,
      onSelectPricingId: handleSelectPricingId,
      catalogPriceUsdText,
      onCatalogPriceUsdTextChange: setCatalogPriceUsdText,
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
      jobNumber: isJobScopedStep ? Math.max(1, (activeJobIndex ?? 0) + 1) : 1,
      showVisitNotes: !isJobScopedStep,
      canAddAnotherJob: false,
    }),
    [
      step,
      catalogError,
      catalog.isLoading,
      enabledServices,
      catalog.categories,
      isCustomJob,
      selectedServiceId,
      handleSelectServiceId,
      customServiceName,
      customPriceUsdText,
      customDurationHhMm,
      pricingPayload.options,
      server.priceOptionsLoading,
      selectedPricingId,
      selectedService,
      handleSelectPricingId,
      catalogPriceUsdText,
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
      isJobScopedStep,
      activeJobIndex,
    ],
  );

  const showMainTitle =
    !isHubView &&
    !isJobsListView &&
    !isAddonsJobsListView &&
    !isJobHubView &&
    (isNotesView || editAppointmentStepShowsMainTitle(step));

  /** Save from every edit screen except job lists (Done returns to the hub). */
  const primarySaves = !isJobsListView && !isAddonsJobsListView;

  const addonsJobsList = useMemo(
    () =>
      (jobs ?? []).map((job, index) => ({ job, index })).filter(({ job }) => !isEditJobCustom(job)),
    [jobs],
  );

  return {
    styles,
    progressPercent,
    showMainTitle,
    mainTitle,
    mainSubtitle,
    stepContentProps,
    isHubView,
    isJobsListView,
    isAddonsJobsListView,
    isJobHubView,
    isNotesView,
    isMultiJob,
    hubSections,
    jobHubSections,
    jobs,
    addonsJobsList,
    notes,
    onChangeNotes: setNotes,
    openEditSection,
    openJobForEdit,
    openJobForAddons,
    isInitializing: Boolean(bookingId) && !bookingErrorMessage && !prefillReady,
    bookingErrorMessage,
    footer: {
      appointmentConfirmed: false,
      canContinue: primarySaves ? canSave && !updateBookingMutation.isPending : true,
      confirmLoading: updateBookingMutation.isPending,
      editHubMode: isHubView,
      editSectionMode: !isHubView,
      lastStepIndex: EDIT_APPOINTMENT_LAST_STEP,
      lastStepPrimaryTitle: 'Save changes',
      lastStepAccessibilityLabel: 'Save appointment changes',
      sectionPrimaryTitle: primarySaves ? 'Save changes' : 'Done',
      step,
      onBack: handleBack,
      onContinue: handleContinue,
      onDone: handleBack,
    },
  };
}
