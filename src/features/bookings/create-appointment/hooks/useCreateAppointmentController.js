import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager } from 'react-native';
import { useToast } from '../../../../components/ui';
import { customersListQueryKey } from '../../../customers/queryKeys';
import { useCustomerSmsAccess } from '../../../sms/hooks/useCustomerSmsAccess';
import { catalogAddonsForService } from '../../../services/utils/catalogAddonsForService';
import { postOwnerManualPublicBooking } from '../api/postOwnerManualPublicBooking';
import { fetchBookingPlaceById } from '../api/fetchBookingPlaceById';
import {
  CREATE_APPOINTMENT_CUSTOM_JOB_ID,
  CREATE_APPOINTMENT_LAST_STEP,
  CREATE_APPOINTMENT_MAX_JOBS,
  CREATE_APPOINTMENT_STEP,
  CREATE_APPOINTMENT_STEP_META,
  addressFormFromPrefilledAddress,
  addressFormHasStreet,
  createEmptyAddressForm,
  createEmptyVehicleForm,
  customerFormFromPrefilledCustomer,
} from '../constants';
import { serviceDurationHHmmToMinutes } from '../../../../components/ui/durationTime';
import { formatPhoneInputAsYouType, normalizePhoneForDatabase } from '../../../../utils/phone';
import {
  isAddressStepComplete,
  parseRequiredCustomJobPriceCents,
} from '../utils/createAppointmentValidators';
import { buildOwnerManualPublicBookingBody } from '../utils/buildOwnerBookingPayload';
import {
  buildAppliedSaleDiscount,
  pickActiveSaleForAppointmentDate,
} from '../utils/applyOwnerBookingSale';
import { formatUsdFromNumber, parsePriceLabelToUsd } from '../utils/priceLabelMath';
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
  reviewPricingOptionLabel,
  shouldSkipCreateFlowPricingStep,
} from '../utils/createFlowPricing';
import {
  createEmptyJobDraft,
  snapshotCommittedJob,
  sumJobDurationsMinutes,
} from '../utils/createAppointmentJobs';
import { useBookingCalendar } from '../../../availability/booking';
import { isSelectedScheduleStillValid } from '../../../availability/booking/utils/bookingCalendar';
import { parseScheduleInputs } from '../../../availability/booking/utils/scheduleInputs';
import { createAppointmentFlowStyles } from '../styles/createAppointmentFlowStyles';
import { showAppointmentConfirmationSmsToast } from '../utils/appointmentConfirmationSmsToast';
import { resolveCreateAppointmentWizardHeader } from '../utils/resolveCreateAppointmentWizardHeader';
import { membershipVisitCustomDurationHhMm } from '../utils/membershipVisitPrefill';
import { membershipCatalogQueryKey } from '../../../subscriptions/queryKeys';
import { useCreateAppointmentServerData } from './useCreateAppointmentServerData';
import { useCreateAppointmentSubmitPanel } from './useCreateAppointmentSubmitPanel';
import { usePastCustomerVehicles } from './usePastCustomerVehicles';

function centsToUsdText(cents) {
  const n = Math.max(0, Math.round(Number(cents) || 0)) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function vehicleLineFromForm(vehicle) {
  return [vehicle?.year, vehicle?.make, vehicle?.model]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

function createDraftLocalId() {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * All wizard state, server data, scheduling, save mutation, and navigation for create appointment.
 *
 * @param {object} args
 * @param {object} args.catalog result of {@link useServicesCatalog}
 * @param {string | undefined} args.userId auth user id
 * @param {string | null | undefined} args.accessToken Supabase session JWT for `POST /api/public/bookings`
 * @param {object} args.navigation React Navigation object with `goBack`
 * @param {import('../utils/membershipVisitPrefill').MembershipVisitPrefill | null} [args.membershipVisitPrefill]
 * @param {{
 *   customerId?: string;
 *   fullName?: string;
 *   email?: string;
 *   phone?: string;
 *   address?: {
 *     street?: string;
 *     unit?: string;
 *     city?: string;
 *     state?: string;
 *     zip?: string;
 *   } | null;
 * } | null} [args.prefilledCustomer]
 *   Seeds Customer (+ optional Address) when launched from an existing customer's profile.
 */
export function useCreateAppointmentController({
  catalog,
  userId,
  accessToken,
  navigation,
  membershipVisitPrefill = null,
  prefilledCustomer = null,
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { canUseSms } = useCustomerSmsAccess();

  const isMembershipVisit = Boolean(membershipVisitPrefill?.membershipId);

  // Mount-only seed from launch params (rebook from customer profile).
  const seededCustomerAddressRef = useRef(
    addressFormFromPrefilledAddress(prefilledCustomer?.address),
  );
  const hasSeededCustomerAddress = addressFormHasStreet(seededCustomerAddressRef.current);
  /** Last mobile address the owner entered this session (seed → edits). Restored on Shop → Mobile. */
  const lastMobileAddressRef = useRef({ ...seededCustomerAddressRef.current });

  const [step, setStep] = useState(
    isMembershipVisit ? CREATE_APPOINTMENT_STEP.PRICING : CREATE_APPOINTMENT_STEP.SERVICE,
  );
  const [servicePickPhase, setServicePickPhase] = useState('chooser');
  const [committedJobs, setCommittedJobs] = useState(
    /** @type {ReturnType<typeof snapshotCommittedJob>[]} */ ([]),
  );
  const draftLocalIdRef = useRef(createDraftLocalId());
  const [selectedServiceId, setSelectedServiceId] = useState(
    isMembershipVisit ? CREATE_APPOINTMENT_CUSTOM_JOB_ID : null,
  );
  const [customServiceName, setCustomServiceName] = useState(() =>
    isMembershipVisit ? String(membershipVisitPrefill?.planName ?? '').trim() : '',
  );
  const [customPriceUsdText, setCustomPriceUsdText] = useState(() =>
    isMembershipVisit ? '0' : '',
  );
  const [customDurationHhMm, setCustomDurationHhMm] = useState(() =>
    isMembershipVisit && membershipVisitPrefill
      ? membershipVisitCustomDurationHhMm(membershipVisitPrefill)
      : '01:00',
  );
  const [selectedPricingId, setSelectedPricingId] = useState(null);
  const [catalogPriceUsdText, setCatalogPriceUsdText] = useState('');
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customer, setCustomer] = useState(() => {
    if (isMembershipVisit && membershipVisitPrefill) {
      return {
        fullName: membershipVisitPrefill.customerName,
        email: membershipVisitPrefill.customerEmail,
        phone: formatPhoneInputAsYouType(membershipVisitPrefill.customerPhone),
      };
    }
    return customerFormFromPrefilledCustomer(prefilledCustomer);
  });
  const [appointmentLocationType, setAppointmentLocationType] = useState(null);
  const [address, setAddress] = useState(() => ({ ...seededCustomerAddressRef.current }));
  const [vehicle, setVehicle] = useState(createEmptyVehicleForm);
  const membershipPlaceRef = useRef(
    /** @type {{ address: ReturnType<typeof createEmptyAddressForm> | null; vehicle: ReturnType<typeof createEmptyVehicleForm> | null }} */ ({
      address: null,
      vehicle: null,
    }),
  );
  const membershipPlaceFetchedRef = useRef(false);
  const [notes, setNotes] = useState(() =>
    isMembershipVisit ? String(membershipVisitPrefill?.notes ?? '').trim() : '',
  );
  const [successReplayKey, setSuccessReplayKey] = useState(0);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [confirmRequested, setConfirmRequested] = useState(false);

  const jobIndex = committedJobs.length;
  const catalogError = catalog.businessError || catalog.catalogError;
  const isCustomJob = selectedServiceId === CREATE_APPOINTMENT_CUSTOM_JOB_ID;
  const customPriceRaw = String(customPriceUsdText ?? '')
    .replace(/\$/g, '')
    .trim();
  const parsedCustomPriceCents = parseRequiredCustomJobPriceCents(customPriceRaw, {
    allowZero: isMembershipVisit,
  });
  const customPriceCents = parsedCustomPriceCents ?? NaN;
  const customPriceError =
    customPriceRaw.length > 0 && parsedCustomPriceCents == null
      ? isMembershipVisit
        ? 'Enter a valid price (0 or more).'
        : 'Price must be greater than $0.'
      : undefined;
  const customDurationMinutes = serviceDurationHHmmToMinutes(customDurationHhMm);
  const customJobComplete = Boolean(
    customServiceName.trim() &&
    customPriceRaw.length > 0 &&
    /\d/.test(customPriceRaw) &&
    parsedCustomPriceCents != null &&
    customDurationMinutes > 0,
  );

  const catalogPriceRaw = String(catalogPriceUsdText ?? '')
    .replace(/\$/g, '')
    .trim();
  const parsedCatalogPriceCents = parseRequiredCustomJobPriceCents(catalogPriceRaw);
  const catalogPriceError =
    !isCustomJob && catalogPriceRaw.length > 0 && parsedCatalogPriceCents == null
      ? 'Price must be greater than $0.'
      : undefined;

  const enabledServices = useMemo(
    () => catalog.services.filter((s) => s.isEnabled !== false),
    [catalog.services],
  );

  const seededCustomerId = String(
    prefilledCustomer?.customerId ?? membershipVisitPrefill?.customerId ?? '',
  ).trim();
  const seededCustomerPhone = normalizePhoneForDatabase(
    prefilledCustomer?.phone ?? membershipVisitPrefill?.customerPhone ?? '',
  );
  const currentCustomerPhone = normalizePhoneForDatabase(customer.phone);
  const customerIdForAssets =
    seededCustomerId && (!currentCustomerPhone || currentCustomerPhone === seededCustomerPhone)
      ? seededCustomerId
      : null;
  const { pastVehicles } = usePastCustomerVehicles({
    businessId: catalog.businessId,
    customerId: customerIdForAssets,
    phone: customer.phone,
    email: customer.email,
  });

  useEffect(() => {
    setSelectedPricingId(null);
    setSelectedAddonIds([]);
    setCatalogPriceUsdText('');
  }, [selectedServiceId]);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDateKey]);

  useEffect(() => {
    if (!isMembershipVisit) return;
    const businessId = String(catalog.businessId ?? '').trim();
    const bookingId = String(membershipVisitPrefill?.initialBookingId ?? '').trim();
    if (!businessId || !bookingId || membershipPlaceFetchedRef.current) return;

    membershipPlaceFetchedRef.current = true;
    let cancelled = false;

    void (async () => {
      const { address: nextAddress, vehicle: nextVehicle } = await fetchBookingPlaceById(
        businessId,
        bookingId,
      );
      if (cancelled) return;

      membershipPlaceRef.current = {
        address: nextAddress,
        vehicle: nextVehicle,
      };

      if (nextAddress) {
        lastMobileAddressRef.current = { ...nextAddress };
        setAddress((prev) => {
          const hasAny = Object.values(prev).some((v) => String(v ?? '').trim());
          return hasAny ? prev : nextAddress;
        });
      }
      if (nextVehicle) {
        setVehicle((prev) => {
          const hasAny = Object.values(prev).some((v) => String(v ?? '').trim());
          return hasAny ? prev : nextVehicle;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [catalog.businessId, isMembershipVisit, membershipVisitPrefill?.initialBookingId]);

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

  const selectedAddonRows = useMemo(() => {
    const idSet = new Set((selectedAddonIds ?? []).map(String));
    return addonsForSelectedService.filter((a) => idSet.has(String(a.id)));
  }, [addonsForSelectedService, selectedAddonIds]);

  const currentJobDurationMinutes = useMemo(
    () =>
      totalBookingDurationMinutes(
        baseServiceDurationMinutes(selectedServiceRow, selectedPricingOption, selectedService),
        selectedAddonRows,
      ),
    [selectedServiceRow, selectedPricingOption, selectedService, selectedAddonRows],
  );

  const buildCurrentJobSnapshot = useCallback(
    () =>
      snapshotCommittedJob({
        localId: draftLocalIdRef.current,
        selectedServiceId,
        isCustomJob,
        selectedService,
        selectedPricingOption,
        selectedAddonRows,
        totalDurationMinutes: currentJobDurationMinutes,
        vehicle,
        catalogPriceUsdText,
        customServiceName,
        customPriceUsdText,
        customDurationHhMm,
        selectedPricingId,
        selectedAddonIds,
      }),
    [
      catalogPriceUsdText,
      currentJobDurationMinutes,
      customDurationHhMm,
      customPriceUsdText,
      customServiceName,
      isCustomJob,
      selectedAddonIds,
      selectedAddonRows,
      selectedPricingId,
      selectedPricingOption,
      selectedService,
      selectedServiceId,
      vehicle,
    ],
  );

  const visitJobs = useMemo(() => {
    if (!selectedServiceId && !isCustomJob) return committedJobs;
    const draft = buildCurrentJobSnapshot();
    const draftId = String(draft.localId ?? '');
    if (draftId && committedJobs.some((job) => String(job.localId) === draftId)) {
      const nextId = createDraftLocalId();
      draftLocalIdRef.current = nextId;
      return [...committedJobs, { ...draft, localId: nextId }];
    }
    return [...committedJobs, draft];
  }, [buildCurrentJobSnapshot, committedJobs, isCustomJob, selectedServiceId]);

  const visitDurationMinutes = useMemo(() => {
    const fromCommitted = sumJobDurationsMinutes(committedJobs);
    if (!selectedServiceId && !isCustomJob) return Math.max(15, fromCommitted);
    return Math.max(15, fromCommitted + currentJobDurationMinutes);
  }, [committedJobs, currentJobDurationMinutes, isCustomJob, selectedServiceId]);

  const reviewJobs = useMemo(
    () =>
      visitJobs.map((job) => ({
        localId: job.localId,
        serviceName: job.serviceName,
        optionLabel: reviewPricingOptionLabel(job),
        priceLabel: job.selectedPricingOption?.priceLabel ?? formatUsdFromNumber(0),
        vehicleLine: vehicleLineFromForm(job.vehicle),
        addonRows: job.selectedAddonRows ?? [],
      })),
    [visitJobs],
  );

  const availableSaleDiscount = useMemo(() => {
    if (isMembershipVisit) return null;
    const sale = pickActiveSaleForAppointmentDate(server.sales, selectedDateKey);
    if (!sale) return null;
    const subtotalCents = visitJobs.reduce((sum, job) => {
      const baseCents = Math.round(Number(job.selectedPricingOption?.priceCents) || 0);
      const addonsCents = (job.selectedAddonRows ?? []).reduce(
        (addonSum, a) =>
          addonSum +
          (a.priceCents != null && Number.isFinite(Number(a.priceCents))
            ? Math.round(Number(a.priceCents))
            : Math.round(parsePriceLabelToUsd(a.priceLabel ?? a.price) * 100)),
        0,
      );
      return sum + baseCents + addonsCents;
    }, 0);
    return buildAppliedSaleDiscount({
      subtotalCents,
      sale,
    });
  }, [isMembershipVisit, selectedDateKey, server.sales, visitJobs]);

  const availableSaleId = availableSaleDiscount?.sale?.id ?? null;
  const [applySaleDiscount, setApplySaleDiscount] = useState(false);

  useEffect(() => {
    setApplySaleDiscount(false);
  }, [availableSaleId]);

  const appliedSaleDiscount = applySaleDiscount ? availableSaleDiscount : null;

  const toggleApplySaleDiscount = useCallback(() => {
    setApplySaleDiscount((prev) => !prev);
  }, []);

  const scheduleLoading =
    server.availabilityLoading || server.blockingLoading || server.priceOptionsLoading;
  const scheduleError =
    server.availabilityError || server.blockingError || server.priceOptionsError || null;

  const bookingCalendar = useBookingCalendar({
    availabilityRow: server.availabilityRow,
    blockingBookingRows: server.blockingBookingRows,
    totalDurationMinutes: visitDurationMinutes,
    selectedDateKey,
    selectedTime,
    onSelectDateKey: setSelectedDateKey,
    onSelectTime: setSelectedTime,
    scheduleLoading,
    ownerManualBooking: true,
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

  // Keep a session snapshot of the mobile address so Shop → Mobile restores edits, not only the seed.
  useEffect(() => {
    if (appointmentLocationType !== CREATE_APPOINTMENT_LOCATION_MOBILE) return;
    lastMobileAddressRef.current = { ...address };
  }, [address, appointmentLocationType]);

  useEffect(() => {
    if (step !== CREATE_APPOINTMENT_STEP.ADDRESS || !addressSkipped) return;
    setStep(CREATE_APPOINTMENT_STEP.VEHICLE);
  }, [step, addressSkipped]);

  const handleSelectLocationType = useCallback(
    (type) => {
      setAppointmentLocationType(type);
      if (type === CREATE_APPOINTMENT_LOCATION_MOBILE) {
        const pref = membershipPlaceRef.current.address;
        if (pref && addressFormHasStreet(pref)) {
          setAddress({ ...pref });
          return;
        }
        const lastMobile = lastMobileAddressRef.current;
        setAddress(addressFormHasStreet(lastMobile) ? { ...lastMobile } : createEmptyAddressForm());
        return;
      }
      setAddress(addressFormFromBusinessShopLocation(server.businessServiceLocation ?? {}));
    },
    [server.businessServiceLocation],
  );

  const resetJobDraftFields = useCallback(() => {
    const empty = createEmptyJobDraft();
    draftLocalIdRef.current = createDraftLocalId();
    setSelectedServiceId(empty.selectedServiceId);
    setCustomServiceName(empty.customServiceName);
    setCustomPriceUsdText(empty.customPriceUsdText);
    setCustomDurationHhMm(empty.customDurationHhMm);
    setSelectedPricingId(empty.selectedPricingId);
    setCatalogPriceUsdText(empty.catalogPriceUsdText);
    setSelectedAddonIds(empty.selectedAddonIds);
    setVehicle(empty.vehicle);
    setServicePickPhase('chooser');
  }, []);

  const restoreJobDraft = useCallback((job) => {
    draftLocalIdRef.current = job?.localId ? String(job.localId) : createDraftLocalId();
    setSelectedServiceId(
      job.isCustomJob ? CREATE_APPOINTMENT_CUSTOM_JOB_ID : job.selectedServiceId,
    );
    setCustomServiceName(job.customServiceName ?? '');
    setCustomPriceUsdText(job.customPriceUsdText ?? '');
    setCustomDurationHhMm(job.customDurationHhMm ?? '01:00');
    setSelectedPricingId(job.selectedPricingId ?? null);
    setCatalogPriceUsdText(
      job.catalogPriceUsdText ||
        (job.selectedPricingOption?.priceCents != null
          ? centsToUsdText(job.selectedPricingOption.priceCents)
          : ''),
    );
    setSelectedAddonIds(job.selectedAddonIds ?? []);
    setVehicle(job.vehicle ?? createEmptyVehicleForm());
    setServicePickPhase(job.isCustomJob ? 'chooser' : 'catalog');
  }, []);

  const submitMutationErrorRef = useRef(/** @type {(error: unknown) => void} */ ((_) => {}));

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      const token = String(accessToken ?? '').trim();
      if (!token) {
        throw new Error('Not signed in');
      }
      const allJobs =
        selectedServiceId || isCustomJob
          ? [...committedJobs, buildCurrentJobSnapshot()]
          : [...committedJobs];
      if (!allJobs.length) {
        throw new Error('Add at least one job before confirming.');
      }

      const body = buildOwnerManualPublicBookingBody({
        catalog,
        selectedDateKey,
        selectedTime,
        customer,
        address,
        notes,
        appointmentLocationType,
        jobs: allJobs,
        availableSaleDiscount,
        applySaleDiscount: isMembershipVisit ? false : applySaleDiscount,
        membershipId: membershipVisitPrefill?.membershipId ?? null,
      });
      const res = await postOwnerManualPublicBooking(token, body);
      if (!res.ok) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: async (data) => {
      await Promise.all([
        invalidateBookingCachesAfterMutation(queryClient, data?.id),
        queryClient.invalidateQueries({
          queryKey: customersListQueryKey(catalog.businessId),
        }),
        queryClient.invalidateQueries({
          queryKey: membershipCatalogQueryKey(catalog.businessId),
        }),
      ]);
      setSuccessReplayKey((n) => n + 1);
      setAppointmentConfirmed(true);
      InteractionManager.runAfterInteractions(() => {
        showAppointmentConfirmationSmsToast(
          toast,
          customer.phone,
          customer.email,
          data?.smsOutcome,
          { smsEnabled: canUseSms },
        );
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

  const navArgs = useMemo(
    () => ({
      addonsSkipped,
      pricingSkipped,
      locationSkipped,
      addressSkipped,
      jobIndex,
      hasScheduleSlot: Boolean(selectedDateKey && selectedTime),
    }),
    [
      addonsSkipped,
      pricingSkipped,
      locationSkipped,
      addressSkipped,
      jobIndex,
      selectedDateKey,
      selectedTime,
    ],
  );

  useEffect(() => {
    if (!addonCatalogKnown) return;
    if (step === CREATE_APPOINTMENT_STEP.ADDONS && addonsSkipped) {
      setStep(
        getNextStepOnContinue({
          step: CREATE_APPOINTMENT_STEP.ADDONS,
          ...navArgs,
          addonsSkipped: true,
        }),
      );
    }
  }, [addonCatalogKnown, addonsSkipped, navArgs, step]);

  useEffect(() => {
    if (step !== CREATE_APPOINTMENT_STEP.PRICING || !pricingSkipped) return;
    setStep(
      getNextStepOnContinue({
        step: CREATE_APPOINTMENT_STEP.PRICING,
        ...navArgs,
        pricingSkipped: true,
      }),
    );
  }, [step, pricingSkipped, navArgs]);

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
        catalogPriceComplete: Boolean(
          isCustomJob || (catalogPriceRaw.length > 0 && parsedCatalogPriceCents != null),
        ),
        hasCommittedJobs: committedJobs.length > 0,
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
      catalogPriceRaw.length,
      parsedCatalogPriceCents,
      committedJobs.length,
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
    const stepCount = getCreateAppointmentWizardStepCount(navArgs);
    const stepIndex = getCreateAppointmentWizardStepIndex(step, navArgs);
    const { title, subtitle } = resolveCreateAppointmentWizardHeader(step, meta, addressStepCopy, {
      servicePickPhase,
      isCustomJob,
      jobNumber: jobIndex + 1,
      hasPastVehicles: pastVehicles.length > 0,
    });
    return {
      stepIndex,
      stepCount,
      title,
      subtitle,
      scrollWithContent: step === CREATE_APPOINTMENT_STEP.REVIEW,
    };
  }, [
    addressStepCopy,
    appointmentConfirmed,
    isCustomJob,
    jobIndex,
    meta,
    navArgs,
    pastVehicles.length,
    servicePickPhase,
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
    setCatalogPriceUsdText('');
    setStep(CREATE_APPOINTMENT_STEP.PRICING);
  }, []);

  const handleSelectServiceId = useCallback((serviceId) => {
    setSelectedServiceId(serviceId);
  }, []);

  const handleAddAnotherJob = useCallback(() => {
    const fromReview = step === CREATE_APPOINTMENT_STEP.REVIEW;
    const fromVehicle = step === CREATE_APPOINTMENT_STEP.VEHICLE;
    if (!fromReview && !fromVehicle) return;
    if (!canContinue) return;
    if (visitJobs.length >= CREATE_APPOINTMENT_MAX_JOBS) {
      toast.info(`You can add up to ${CREATE_APPOINTMENT_MAX_JOBS} jobs on one visit.`);
      return;
    }

    // Snapshot eagerly — do not call buildCurrentJobSnapshot inside setState.
    // resetJobDraftFields() rotates draftLocalIdRef synchronously; a lazy updater
    // would commit the *new* draft id and collide when the next job is appended.
    const snapshot = buildCurrentJobSnapshot();
    setCommittedJobs((prev) => {
      if (prev.some((job) => String(job.localId) === String(snapshot.localId))) {
        return prev;
      }
      return [...prev, snapshot];
    });
    resetJobDraftFields();
    setStep(CREATE_APPOINTMENT_STEP.SERVICE);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [buildCurrentJobSnapshot, canContinue, resetJobDraftFields, step, toast, visitJobs.length]);

  const handleCancelNewJob = useCallback(() => {
    if (committedJobs.length === 0) return;
    const previous = committedJobs[committedJobs.length - 1];
    setCommittedJobs((prev) => prev.slice(0, -1));
    restoreJobDraft(previous);
    setStep(CREATE_APPOINTMENT_STEP.REVIEW);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }, [committedJobs, restoreJobDraft]);

  const handleRemoveVisitJob = useCallback(
    (localId) => {
      const id = String(localId ?? '');
      if (!id) return;
      if (visitJobs.length <= 1) {
        toast.info('Keep at least one job on this visit.');
        return;
      }

      const committedIdx = committedJobs.findIndex((job) => String(job.localId) === id);
      if (committedIdx >= 0) {
        setCommittedJobs((prev) => prev.filter((job) => String(job.localId) !== id));
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        return;
      }

      // Removing the active draft — leave committed jobs intact (frozen snapshots).
      if (committedJobs.length === 0) return;
      resetJobDraftFields();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    },
    [committedJobs, resetJobDraftFields, toast, visitJobs.length],
  );

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
    if (
      step === CREATE_APPOINTMENT_STEP.SERVICE &&
      servicePickPhase === 'chooser' &&
      committedJobs.length > 0
    ) {
      handleCancelNewJob();
      return;
    }
    if (step === CREATE_APPOINTMENT_STEP.PRICING && isCustomJob) {
      if (isMembershipVisit) {
        navigation.goBack();
        return;
      }
      setStep(CREATE_APPOINTMENT_STEP.SERVICE);
      setServicePickPhase('chooser');
      return;
    }
    if (step > CREATE_APPOINTMENT_STEP.SERVICE) {
      setStep(getPreviousStepOnBack({ step, ...navArgs }));
      return;
    }
    navigation.goBack();
  }, [
    appointmentConfirmed,
    clearSubmitError,
    committedJobs.length,
    handleCancelNewJob,
    isCustomJob,
    isMembershipVisit,
    navArgs,
    navigation,
    servicePickPhase,
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
        minimumNotice,
      } = parseScheduleInputs(freshSchedule.availabilityRow);
      const freshScheduleCtx = {
        acceptBookings: freshAcceptBookings,
        weeklySchedule,
        timeOffBlocks,
        minimumNotice,
        blockingBookingRows: freshSchedule.blockingBookingRows,
        totalDurationMinutes: visitDurationMinutes,
        ownerManualBooking: true,
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
    setStep(getNextStepOnContinue({ step, ...navArgs }));
  }, [
    appointmentConfirmed,
    canContinue,
    clearSubmitError,
    confirmRequested,
    createBookingMutation,
    handleMutationError,
    navArgs,
    selectedDateKey,
    selectedTime,
    server,
    step,
    toast,
    visitDurationMinutes,
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
      onSelectPricingId: handleSelectPricingId,
      catalogPriceUsdText,
      catalogPriceError,
      onCatalogPriceUsdTextChange: setCatalogPriceUsdText,
      pricingSkipped,
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
      isReturningCustomer: Boolean(prefilledCustomer) || isMembershipVisit,
      onChangeCustomer: setCustomer,
      appointmentLocationType,
      onSelectLocationType: handleSelectLocationType,
      shopAddressMissing,
      address,
      isReturningCustomerAddress: hasSeededCustomerAddress,
      onChangeAddress: setAddress,
      vehicle,
      pastVehicles,
      notes,
      totalDurationMinutes: visitDurationMinutes,
      onChangeVehicle: setVehicle,
      onChangeNotes: setNotes,
      showSubmitPanel,
      availableSaleDiscount,
      applySaleDiscount,
      onToggleApplySaleDiscount: toggleApplySaleDiscount,
      appliedSaleDiscount,
      reviewJobs,
      jobNumber: jobIndex + 1,
      committedJobsSummary: committedJobs.map((job) => ({
        localId: job.localId,
        serviceName: job.serviceName,
        vehicleLine: vehicleLineFromForm(job.vehicle),
        priceLabel: job.selectedPricingOption?.priceLabel ?? '',
      })),
      canAddAnotherJob:
        !isMembershipVisit &&
        (step === CREATE_APPOINTMENT_STEP.REVIEW || step === CREATE_APPOINTMENT_STEP.VEHICLE) &&
        visitJobs.length < CREATE_APPOINTMENT_MAX_JOBS &&
        Boolean(selectedServiceId || isCustomJob),
      addAnotherJobDisabled: !canContinue,
      onAddAnotherJob: handleAddAnotherJob,
      onCancelNewJob: jobIndex > 0 ? handleCancelNewJob : undefined,
      onRemoveJob: handleRemoveVisitJob,
      isMembershipVisit,
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
      handleSelectPricingId,
      catalogPriceUsdText,
      catalogPriceError,
      pricingSkipped,
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
      prefilledCustomer,
      hasSeededCustomerAddress,
      appointmentLocationType,
      handleSelectLocationType,
      address,
      shopAddressMissing,
      vehicle,
      pastVehicles,
      notes,
      visitDurationMinutes,
      availableSaleDiscount,
      applySaleDiscount,
      toggleApplySaleDiscount,
      appliedSaleDiscount,
      reviewJobs,
      jobIndex,
      committedJobs,
      visitJobs.length,
      handleAddAnotherJob,
      canContinue,
      handleCancelNewJob,
      handleRemoveVisitJob,
      isMembershipVisit,
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
          : step === CREATE_APPOINTMENT_STEP.SERVICE &&
              servicePickPhase === 'chooser' &&
              jobIndex > 0
            ? 'Cancel job'
            : undefined,
      onBack: handleBack,
      onContinue: handleContinue,
      onDone: handleDone,
    },
  };
}
