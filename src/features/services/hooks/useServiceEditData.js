import { useQuery } from '@tanstack/react-query';
import { minutesToServiceDurationHHmm } from '../../../components/ui/durationTime';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import {
  detectPriceOptionLabelColumn,
  fetchAddonAssignmentsForService,
  fetchBusinessServices,
  fetchServiceAddons,
  fetchServicePriceOptions,
} from '../api/services';
import { serviceEditorQueryKey } from '../queryKeys';
import { mapServiceAddonRowToEditorOption } from '../utils/serviceAddonModel';

function pick(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null) return row[key];
  }
  return null;
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function centsToInput(cents) {
  const n = asNumber(cents);
  if (n == null || n < 0) return '';
  return (n / 100).toFixed(2);
}

function sortByOrderThenName(a, b) {
  const orderA = asNumber(a.sortOrder);
  const orderB = asNumber(b.sortOrder);
  if (orderA != null && orderB != null && orderA !== orderB) return orderA - orderB;
  if (orderA != null && orderB == null) return -1;
  if (orderA == null && orderB != null) return 1;
  return String(a.label ?? a.name ?? '').localeCompare(String(b.label ?? b.name ?? ''));
}

function mapServiceEditModel({
  serviceRow,
  priceOptionRows,
  addonRows,
  assignmentRows,
  routeService,
}) {
  const serviceId = String(pick(serviceRow, ['id']) ?? routeService?.id ?? '');
  const serviceName = String(
    pick(serviceRow, ['name', 'service_name', 'title']) ?? routeService?.name ?? 'Service',
  ).trim();
  const description = String(
    pick(serviceRow, ['description', 'details']) ?? routeService?.description ?? '',
  ).trim();
  const price = centsToInput(pick(serviceRow, ['price_cents', 'priceCents']));
  const durationHHmm =
    minutesToServiceDurationHHmm(pick(serviceRow, ['duration_minutes', 'durationMinutes'])) || '';

  const pricingOptions = (priceOptionRows ?? [])
    .filter((row) => {
      const rowServiceId = String(
        pick(row, ['service_id', 'business_service_id', 'serviceId']) ?? '',
      );
      return rowServiceId.length > 0 && rowServiceId === serviceId;
    })
    .map((row) => ({
      id: String(pick(row, ['id']) ?? `option-${Math.random().toString(36).slice(2)}`),
      label: String(pick(row, ['name', 'label', 'title']) ?? 'Option').trim(),
      price: centsToInput(pick(row, ['price_cents', 'priceCents'])),
      durationHHmm:
        minutesToServiceDurationHHmm(pick(row, ['duration_minutes', 'durationMinutes'])) || '',
      sortOrder: pick(row, ['sort_order', 'display_order', 'position']),
    }))
    .sort(sortByOrderThenName);

  const addonOptions = (addonRows ?? [])
    .map((row) => mapServiceAddonRowToEditorOption(row))
    .filter((row) => row.id.length > 0)
    .sort(sortByOrderThenName);

  const selectedAddonIds = (assignmentRows ?? [])
    .filter((row) => {
      const rowServiceId = String(
        pick(row, ['service_id', 'business_service_id', 'serviceId']) ?? '',
      );
      return rowServiceId.length > 0 && rowServiceId === serviceId;
    })
    .map((row) => String(pick(row, ['addon_id', 'service_addon_id', 'addonId']) ?? ''))
    .filter(Boolean);

  const samplePriceOptionRow =
    (priceOptionRows ?? []).find((row) => row && typeof row === 'object') ?? null;
  const priceOptionLabelKey = detectPriceOptionLabelColumn(samplePriceOptionRow);

  return {
    serviceId,
    serviceName,
    description,
    price,
    durationHHmm,
    pricingOptions,
    addonOptions,
    selectedAddonIds,
    multiPriceEnabled: pricingOptions.length > 1,
    priceOptionLabelKey,
  };
}

export function useServiceEditData(serviceId, routeService) {
  const { user } = useAuth();
  const userId = user?.id;

  const businessQ = useQuery({
    queryKey: homeBusinessProfileQueryKey(userId),
    queryFn: async () => {
      const { data, error } = await fetchBusinessProfileForUser(userId);
      if (error) throw new Error(error.message ?? 'Could not load business');
      return data;
    },
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;

  const editorQ = useQuery({
    queryKey: serviceEditorQueryKey(businessId, serviceId),
    queryFn: async () => {
      const [
        { data: servicesRows, error: servicesError },
        { data: optionRows, error: optionError },
        { data: addonRows, error: addonError },
        { data: assignmentRows, error: assignmentError },
      ] = await Promise.all([
        fetchBusinessServices(businessId),
        fetchServicePriceOptions(businessId),
        fetchServiceAddons(businessId),
        fetchAddonAssignmentsForService(serviceId),
      ]);

      const hardError = servicesError ?? optionError ?? addonError;
      if (hardError) throw new Error(hardError.message ?? 'Could not load service edit data');

      const matchedService =
        (servicesRows ?? []).find((row) => String(pick(row, ['id']) ?? '') === String(serviceId)) ??
        null;

      return mapServiceEditModel({
        serviceRow: matchedService,
        priceOptionRows: optionRows ?? [],
        addonRows: addonRows ?? [],
        assignmentRows: assignmentError ? [] : (assignmentRows ?? []),
        routeService,
      });
    },
    enabled: Boolean(businessId && serviceId),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    businessId,
    isLoading: businessQ.isPending || editorQ.isPending,
    errorMessage: editorQ.isError
      ? (editorQ.error?.message ?? 'Could not load service details')
      : businessQ.isError
        ? (businessQ.error?.message ?? 'Could not load business')
        : null,
    data: editorQ.data ?? null,
  };
}
