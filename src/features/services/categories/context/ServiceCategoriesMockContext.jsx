import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  MOCK_SERVICE_CATEGORIES,
  UNCATEGORIZED_CATEGORY_OPTION,
} from '../constants/mockServiceCategories';

const ServiceCategoriesMockContext = createContext(null);

function createCategoryId() {
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ServiceCategoriesMockProvider({ children }) {
  const [categories, setCategories] = useState(MOCK_SERVICE_CATEGORIES);
  const [serviceCategoryById, setServiceCategoryById] = useState({});

  const addCategory = useCallback(({ name }) => {
    const trimmed = String(name ?? '').trim();
    if (!trimmed) return null;
    const next = {
      id: createCategoryId(),
      name: trimmed,
      servicesCountLabel: '0 services',
    };
    setCategories((prev) => [...prev, next]);
    return next;
  }, []);

  const updateCategory = useCallback(({ categoryId, name }) => {
    const trimmed = String(name ?? '').trim();
    if (!trimmed || !categoryId) return;
    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, name: trimmed } : cat)),
    );
  }, []);

  const deleteCategory = useCallback((categoryId) => {
    if (!categoryId) return;
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    setServiceCategoryById((prev) => {
      const next = { ...prev };
      for (const [serviceId, assignedCategoryId] of Object.entries(next)) {
        if (assignedCategoryId === categoryId) {
          delete next[serviceId];
        }
      }
      return next;
    });
  }, []);

  const getServiceCategory = useCallback(
    (serviceId) => serviceCategoryById[String(serviceId ?? '')] ?? '',
    [serviceCategoryById],
  );

  const setServiceCategory = useCallback((serviceId, categoryId) => {
    const normalizedServiceId = String(serviceId ?? '').trim();
    if (!normalizedServiceId) return;
    const normalizedCategoryId = String(categoryId ?? '').trim();
    setServiceCategoryById((prev) => {
      if (!normalizedCategoryId) {
        if (!(normalizedServiceId in prev)) return prev;
        const next = { ...prev };
        delete next[normalizedServiceId];
        return next;
      }
      if (prev[normalizedServiceId] === normalizedCategoryId) return prev;
      return { ...prev, [normalizedServiceId]: normalizedCategoryId };
    });
  }, []);

  const categorySelectOptions = useMemo(
    () => categories.map((cat) => ({ value: cat.id, label: cat.name })),
    [categories],
  );

  const categorySelectOptionsWithNone = useMemo(
    () => [UNCATEGORIZED_CATEGORY_OPTION, ...categorySelectOptions],
    [categorySelectOptions],
  );

  const value = useMemo(
    () => ({
      categories,
      categorySelectOptions,
      categorySelectOptionsWithNone,
      serviceCategoryById,
      addCategory,
      updateCategory,
      deleteCategory,
      getServiceCategory,
      setServiceCategory,
    }),
    [
      addCategory,
      categories,
      categorySelectOptions,
      categorySelectOptionsWithNone,
      deleteCategory,
      getServiceCategory,
      serviceCategoryById,
      setServiceCategory,
      updateCategory,
    ],
  );

  return (
    <ServiceCategoriesMockContext.Provider value={value}>
      {children}
    </ServiceCategoriesMockContext.Provider>
  );
}

export function useServiceCategoriesMock() {
  const ctx = useContext(ServiceCategoriesMockContext);
  if (!ctx) {
    throw new Error('useServiceCategoriesMock must be used within ServiceCategoriesMockProvider');
  }
  return ctx;
}
