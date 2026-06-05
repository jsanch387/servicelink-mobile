/** UI-only mock categories — vehicle/customer segments, not service types. Remove when API is wired. */
export const MOCK_SERVICE_CATEGORIES = [
  {
    id: 'cat-cars',
    name: 'Cars',
    servicesCountLabel: '2 services',
  },
  {
    id: 'cat-rvs',
    name: 'RVs',
    servicesCountLabel: '1 service',
  },
  {
    id: 'cat-boats',
    name: 'Boats',
    servicesCountLabel: '0 services',
  },
];

/** Prepended to category pickers so assignment stays optional. */
export const UNCATEGORIZED_CATEGORY_OPTION = {
  value: '',
  label: 'None',
};
