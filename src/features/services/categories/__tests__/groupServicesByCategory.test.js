import { UNCATEGORIZED_TAB_LABEL } from '../constants/categoryCatalogUi';
import { UNCATEGORIZED_SERVICES_GROUP_ID } from '../constants/categoryIds';
import {
  buildServiceCategoryTabs,
  countServicesAssignedToCategory,
  withCategoryServiceCounts,
} from '../utils/groupServicesByCategory';

describe('countServicesAssignedToCategory', () => {
  it('counts services assigned to a category', () => {
    expect(
      countServicesAssignedToCategory(
        [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
        { s1: 'cat-a', s2: 'cat-b', s3: 'cat-a' },
        'cat-a',
      ),
    ).toBe(2);
  });

  it('returns 0 for empty category id', () => {
    expect(countServicesAssignedToCategory([{ id: 's1' }], { s1: 'cat-a' }, '')).toBe(0);
  });
});

describe('withCategoryServiceCounts', () => {
  it('adds assignedServiceCount and servicesCountLabel', () => {
    const result = withCategoryServiceCounts(
      [{ id: 'cat-a', name: 'Cars' }],
      [{ id: 's1' }, { id: 's2' }],
      { s1: 'cat-a' },
    );

    expect(result).toEqual([
      {
        id: 'cat-a',
        name: 'Cars',
        assignedServiceCount: 1,
        servicesCountLabel: '1 service',
      },
    ]);
  });
});

describe('buildServiceCategoryTabs', () => {
  const cars = { id: 'cat-cars', name: 'Cars' };
  const rvs = { id: 'cat-rvs', name: 'RVs' };

  it('preserves category order from the categories array', () => {
    const tabs = buildServiceCategoryTabs({
      categories: [rvs, cars],
      services: [{ id: 's1' }, { id: 's2' }],
      serviceCategoryById: { s1: 'cat-cars', s2: 'cat-rvs' },
    });

    expect(tabs?.map((tab) => tab.id)).toEqual(['cat-rvs', 'cat-cars']);
  });

  it('includes empty category tabs with zero count', () => {
    const tabs = buildServiceCategoryTabs({
      categories: [cars, rvs],
      services: [{ id: 's1' }],
      serviceCategoryById: { s1: 'cat-cars' },
    });

    expect(tabs).toEqual([
      expect.objectContaining({ id: 'cat-cars', count: 1 }),
      expect.objectContaining({ id: 'cat-rvs', count: 0, services: [] }),
    ]);
  });

  it('appends No category tab when unassigned services exist', () => {
    const tabs = buildServiceCategoryTabs({
      categories: [cars],
      services: [{ id: 's1' }, { id: 's2' }],
      serviceCategoryById: { s1: 'cat-cars' },
    });

    expect(tabs?.[1]).toEqual(
      expect.objectContaining({
        id: UNCATEGORIZED_SERVICES_GROUP_ID,
        name: UNCATEGORIZED_TAB_LABEL,
        count: 1,
      }),
    );
  });
});
