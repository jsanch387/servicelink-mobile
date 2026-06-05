import { useMutation, useQueryClient } from '@tanstack/react-query';
import { homeBusinessProfileQueryKey } from '../../../home/queryKeys';
import {
  deleteServiceCategory,
  insertServiceCategory,
  updateServiceCategory,
} from '../api/serviceCategories';
import {
  buildCategorySelectOptionsWithNone,
  buildServiceCategoriesFromRows,
} from '../utils/buildServiceCategoriesModel';
import { SERVICES_QUERY_ROOT, servicesCatalogQueryKey } from '../../queryKeys';

function categoryMutationError(error, fallback) {
  if (error?.code === '23505') {
    return new Error('A category with this name already exists.');
  }
  return new Error(error?.message ?? fallback);
}

function patchCatalogCategories(queryClient, businessId, nextCategories) {
  queryClient.setQueryData(servicesCatalogQueryKey(businessId), (old) => {
    if (!old) return old;
    return {
      ...old,
      categories: nextCategories,
      categorySelectOptionsWithNone: buildCategorySelectOptionsWithNone(nextCategories),
      categoriesError: null,
    };
  });
}

function patchCatalogAfterCategoryDelete(queryClient, businessId, categoryId) {
  queryClient.setQueryData(servicesCatalogQueryKey(businessId), (old) => {
    if (!old) return old;

    const nextCategories = (old.categories ?? []).filter((cat) => cat.id !== categoryId);
    const nextServiceCategoryById = { ...(old.serviceCategoryById ?? {}) };
    for (const [serviceId, assignedCategoryId] of Object.entries(nextServiceCategoryById)) {
      if (assignedCategoryId === categoryId) {
        delete nextServiceCategoryById[serviceId];
      }
    }

    return {
      ...old,
      categories: nextCategories,
      categorySelectOptionsWithNone: buildCategorySelectOptionsWithNone(nextCategories),
      serviceCategoryById: nextServiceCategoryById,
      categoriesError: null,
    };
  });
}

export function useMutateServiceCategory({ businessId, userId }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ mode, categoryId, name, sortOrder }) => {
      if (!businessId) {
        throw new Error('Missing business context.');
      }

      if (mode === 'create') {
        const { data, error } = await insertServiceCategory({
          businessId,
          name,
          sortOrder,
        });
        if (error) throw categoryMutationError(error, 'Could not create category');
        if (!data) throw new Error('Could not create category');
        return { mode, category: data };
      }

      if (!categoryId) throw new Error('Missing category id');

      if (mode === 'update') {
        const { data, error } = await updateServiceCategory({
          businessId,
          categoryId,
          name,
        });
        if (error) throw categoryMutationError(error, 'Could not update category');
        if (!data) throw new Error('Could not update category');
        return { mode, category: data };
      }

      if (mode === 'delete') {
        const { error } = await deleteServiceCategory({ businessId, categoryId });
        if (error) throw categoryMutationError(error, 'Could not delete category');
        return { mode, categoryId };
      }

      throw new Error('Unknown category mutation mode');
    },
    onSuccess: async (result) => {
      if (!businessId) return;

      const current = queryClient.getQueryData(servicesCatalogQueryKey(businessId));
      const currentCategories = current?.categories ?? [];

      if (result.mode === 'create') {
        const created = buildServiceCategoriesFromRows([result.category]);
        patchCatalogCategories(
          queryClient,
          businessId,
          [...currentCategories, ...created].sort((a, b) => {
            const orderA = a.sortOrder ?? 0;
            const orderB = b.sortOrder ?? 0;
            if (orderA !== orderB) return orderA - orderB;
            return String(a.name).localeCompare(String(b.name));
          }),
        );
      }

      if (result.mode === 'update') {
        const [updated] = buildServiceCategoriesFromRows([result.category]);
        if (updated) {
          patchCatalogCategories(
            queryClient,
            businessId,
            currentCategories.map((cat) => (cat.id === updated.id ? updated : cat)),
          );
        }
      }

      if (result.mode === 'delete') {
        patchCatalogAfterCategoryDelete(queryClient, businessId, result.categoryId);
      }

      await Promise.all([
        queryClient.refetchQueries({ queryKey: servicesCatalogQueryKey(businessId) }),
        queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_ROOT }),
        queryClient.invalidateQueries({ queryKey: homeBusinessProfileQueryKey(userId) }),
      ]);
    },
  });

  return {
    mutateCategory: mutation.mutateAsync,
    isSavingCategory: mutation.isPending,
    mutateCategoryError: mutation.error?.message ?? null,
  };
}
