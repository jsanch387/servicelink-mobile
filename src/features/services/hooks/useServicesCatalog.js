import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '../../auth';
import { fetchBusinessProfileForUser } from '../../home/api/homeDashboard';
import { homeBusinessProfileQueryKey } from '../../home/queryKeys';
import { fetchServiceCategories } from '../categories/api/serviceCategories';
import {
  buildCategorySelectOptionsWithNone,
  buildServiceCategoriesFromRows,
  buildServiceCategoryByIdFromServiceRows,
} from '../categories/utils/buildServiceCategoriesModel';
import {
  fetchAddonAssignmentsByService,
  fetchBusinessServices,
  fetchServiceAddons,
} from '../api/services';
import { servicesCatalogQueryKey, SERVICES_QUERY_ROOT } from '../queryKeys';
import {
  buildServicesCatalogModel,
  deriveServicesSummary,
} from '../utils/buildServicesCatalogModel';

const EMPTY_LIST = [];
const EMPTY_ASSIGNMENTS = [];
const EMPTY_SUMMARY = { totalServices: 0, totalAddons: 0 };
const EMPTY_CATEGORY_MAP = {};

function categoriesErrorMessage(error) {
  return error?.message ?? 'Could not load categories';
}

export function useServicesCatalog() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

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
    gcTime: 15 * 60 * 1000,
  });

  const businessId = businessQ.data?.id ?? null;
  const hasBusinessRow = Boolean(businessId);

  const catalogQ = useQuery({
    queryKey: servicesCatalogQueryKey(businessId),
    queryFn: async () => {
      const [
        { data: servicesRows, error: servicesError },
        { data: addonsRows, error: addonsError },
        { data: assignmentRows, error: assignmentError },
        categoriesResult,
      ] = await Promise.all([
        fetchBusinessServices(businessId),
        fetchServiceAddons(businessId),
        fetchAddonAssignmentsByService(businessId),
        fetchServiceCategories(businessId),
      ]);

      const hardError = servicesError ?? addonsError;
      if (hardError) {
        throw new Error(hardError.message ?? 'Could not load service catalog');
      }

      const categoriesError = categoriesResult.error
        ? categoriesErrorMessage(categoriesResult.error)
        : null;
      const categories = categoriesResult.error
        ? []
        : buildServiceCategoriesFromRows(categoriesResult.data);

      const model = buildServicesCatalogModel(
        servicesRows ?? [],
        addonsRows ?? [],
        assignmentError ? [] : (assignmentRows ?? []),
      );
      const summary = deriveServicesSummary(model);
      const serviceCategoryById = buildServiceCategoryByIdFromServiceRows(servicesRows);

      return {
        services: model.services,
        serviceRows: servicesRows ?? [],
        addons: model.addons,
        addonAssignments: assignmentError ? [] : (assignmentRows ?? []),
        summary,
        categories,
        serviceCategoryById,
        categorySelectOptionsWithNone: buildCategorySelectOptionsWithNone(categories),
        categoriesError,
      };
    },
    enabled: hasBusinessRow,
    staleTime: 45 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const businessError = businessQ.isError
    ? (businessQ.error?.message ?? 'Could not load business')
    : null;
  const catalogError = catalogQ.isError
    ? (catalogQ.error?.message ?? 'Could not load service catalog')
    : null;

  const isPendingBusiness = Boolean(userId) && businessQ.isPending;
  const isPendingCatalog = hasBusinessRow && catalogQ.isPending;
  const isLoading = isPendingBusiness || isPendingCatalog;
  const isFetching = businessQ.isFetching || catalogQ.isFetching;

  const refetch = useCallback(async () => {
    await queryClient.refetchQueries({ queryKey: SERVICES_QUERY_ROOT });
    if (userId) {
      await queryClient.refetchQueries({ queryKey: homeBusinessProfileQueryKey(userId) });
    }
  }, [queryClient, userId]);

  return {
    businessId,
    businessSlug: businessQ.data?.business_slug ?? null,
    businessError,
    catalogError,
    categoriesError: catalogQ.data?.categoriesError ?? null,
    isLoading,
    isFetching,
    refetch,
    services: catalogQ.data?.services ?? EMPTY_LIST,
    serviceRows: catalogQ.data?.serviceRows ?? EMPTY_LIST,
    addons: catalogQ.data?.addons ?? EMPTY_LIST,
    addonAssignments: catalogQ.data?.addonAssignments ?? EMPTY_ASSIGNMENTS,
    summary: catalogQ.data?.summary ?? EMPTY_SUMMARY,
    categories: catalogQ.data?.categories ?? EMPTY_LIST,
    serviceCategoryById: catalogQ.data?.serviceCategoryById ?? EMPTY_CATEGORY_MAP,
    categorySelectOptionsWithNone: catalogQ.data?.categorySelectOptionsWithNone ?? [],
  };
}
