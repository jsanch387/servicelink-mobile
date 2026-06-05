export {
  ServiceCategoriesMockProvider,
  useServiceCategoriesMock,
} from './context/ServiceCategoriesMockContext';

export { CategoryEditorSheet } from './components/CategoryEditorSheet';
export { ServiceCatalogMetaRow } from './components/ServiceCatalogMetaRow';
export { ServiceReorderBottomBar } from './components/ServiceReorderBottomBar';
export { ServiceReorderHeaderBlock } from './components/ServiceReorderHeaderBlock';
export { ServiceCategoryTabs } from './components/ServiceCategoryTabs';
export { ServiceCategoryPickerField } from './components/ServiceCategoryPickerField';
export { ServiceCategorySectionContent } from './components/ServiceCategorySectionContent';
export { ServiceCategorySectionHeader } from './components/ServiceCategorySectionHeader';
export { ServiceCategoriesHowItWorksSheet } from './components/ServiceCategoriesHowItWorksSheet';

export { useServiceCategoryTabs } from './hooks/useServiceCategoryTabs';

export {
  buildServiceCategoryTabs,
  groupServicesByCategory,
  withCategoryServiceCounts,
  UNCATEGORIZED_SERVICES_GROUP_ID,
} from './utils/groupServicesByCategory';

export {
  shouldShowCategoryTabs,
  UNCATEGORIZED_TAB_LABEL,
  isUncategorizedTabId,
} from './constants/categoryCatalogUi';
export {
  UNCATEGORIZED_CATEGORY_OPTION,
  MOCK_SERVICE_CATEGORIES,
} from './constants/mockServiceCategories';
export {
  getServicesForCategoryTab,
  mergeServicesOrderWithinTab,
  hasOrderChangesWithinTab,
} from './utils/serviceOrderWithinCategoryTab';
