import { shouldShowCategoryTabs, UNCATEGORIZED_TAB_LABEL } from '../constants/categoryCatalogUi';
import {
  getServicesForCategoryTab,
  hasOrderChangesWithinTab,
  mergeServicesOrderWithinTab,
} from '../utils/serviceOrderWithinCategoryTab';
import { UNCATEGORIZED_SERVICES_GROUP_ID } from '../constants/categoryIds';

describe('shouldShowCategoryTabs', () => {
  const cars = { id: 'cat-cars', name: 'Cars' };
  const rvs = { id: 'cat-rvs', name: 'RVs' };

  it('returns false with no categories', () => {
    expect(
      shouldShowCategoryTabs({
        categories: [],
        services: [{ id: 's1' }],
        serviceCategoryById: {},
      }),
    ).toBe(false);
  });

  it('returns false with one category and all services assigned', () => {
    expect(
      shouldShowCategoryTabs({
        categories: [cars],
        services: [{ id: 's1' }, { id: 's2' }],
        serviceCategoryById: { s1: 'cat-cars', s2: 'cat-cars' },
      }),
    ).toBe(false);
  });

  it('returns true with one category and unassigned services', () => {
    expect(
      shouldShowCategoryTabs({
        categories: [cars],
        services: [{ id: 's1' }, { id: 's2' }],
        serviceCategoryById: { s1: 'cat-cars' },
      }),
    ).toBe(true);
  });

  it('returns true with two or more categories', () => {
    expect(
      shouldShowCategoryTabs({
        categories: [cars, rvs],
        services: [{ id: 's1' }],
        serviceCategoryById: { s1: 'cat-cars' },
      }),
    ).toBe(true);
  });
});

describe('service order within tab', () => {
  it('labels uncategorized tab as Other in constants', () => {
    expect(UNCATEGORIZED_TAB_LABEL).toBe('Other');
  });

  it('merges reordered tab services back into full list', () => {
    const full = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const merged = mergeServicesOrderWithinTab(full, ['b', 'c'], [{ id: 'c' }, { id: 'b' }]);
    expect(merged.map((s) => s.id)).toEqual(['a', 'c', 'b']);
  });

  it('filters Other tab services', () => {
    const list = getServicesForCategoryTab(
      [{ id: 'a' }, { id: 'b' }],
      UNCATEGORIZED_SERVICES_GROUP_ID,
      { a: 'cat-1' },
    );
    expect(list.map((s) => s.id)).toEqual(['b']);
  });

  it('detects order changes within tab only', () => {
    const catalog = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const draft = [{ id: 'a' }, { id: 'c' }, { id: 'b' }];
    expect(hasOrderChangesWithinTab(catalog, draft, ['b', 'c'])).toBe(true);
    expect(hasOrderChangesWithinTab(catalog, catalog, ['b', 'c'])).toBe(false);
  });
});
