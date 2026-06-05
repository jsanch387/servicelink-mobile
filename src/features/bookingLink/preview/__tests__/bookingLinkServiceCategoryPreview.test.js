import { UNCATEGORIZED_SERVICES_GROUP_ID } from '../../../services/categories/constants/categoryIds';
import { BOOKING_LINK_ALL_CATEGORY_ID } from '../../constants/bookingLinkServiceCategories';
import {
  buildBookingLinkCategoryFilterTabs,
  filterBookingLinkServicesByCategory,
  shouldShowBookingLinkCategoryFilters,
} from '../utils/bookingLinkServiceCategoryPreview';

const CATEGORIES = [
  { id: 'cat-cars', name: 'Cars' },
  { id: 'cat-rvs', name: 'RVs' },
];

describe('bookingLinkServiceCategoryPreview', () => {
  it('hides filters when grouping adds no value', () => {
    expect(shouldShowBookingLinkCategoryFilters([], [{ id: 's1' }])).toBe(false);
    expect(
      shouldShowBookingLinkCategoryFilters(CATEGORIES, [
        { id: 's1', categoryId: 'cat-cars' },
        { id: 's2', categoryId: 'cat-cars' },
      ]),
    ).toBe(true);
    expect(
      shouldShowBookingLinkCategoryFilters(
        [{ id: 'cat-cars', name: 'Cars' }],
        [
          { id: 's1', categoryId: 'cat-cars' },
          { id: 's2', categoryId: 'cat-cars' },
        ],
      ),
    ).toBe(false);
  });

  it('builds All tab plus category tabs and No category when needed', () => {
    const services = [
      { id: 's1', categoryId: 'cat-cars' },
      { id: 's2', categoryId: null },
    ];

    const tabs = buildBookingLinkCategoryFilterTabs(CATEGORIES, services);
    expect(tabs?.[0]).toEqual({ id: BOOKING_LINK_ALL_CATEGORY_ID, name: 'All' });
    expect(tabs?.some((tab) => tab.id === UNCATEGORIZED_SERVICES_GROUP_ID)).toBe(true);
  });

  it('filters services by selected category tab', () => {
    const services = [
      { id: 's1', categoryId: 'cat-cars' },
      { id: 's2', categoryId: 'cat-rvs' },
      { id: 's3', categoryId: null },
    ];

    expect(filterBookingLinkServicesByCategory(services, 'cat-cars')).toEqual([services[0]]);
    expect(filterBookingLinkServicesByCategory(services, UNCATEGORIZED_SERVICES_GROUP_ID)).toEqual([
      services[2],
    ]);
    expect(
      filterBookingLinkServicesByCategory(services, BOOKING_LINK_ALL_CATEGORY_ID),
    ).toHaveLength(3);
  });
});
