import {
  buildCategorySelectOptionsWithNone,
  buildServiceCategoriesFromRows,
  buildServiceCategoryByIdFromServiceRows,
} from '../utils/buildServiceCategoriesModel';

describe('buildServiceCategoriesFromRows', () => {
  it('maps and sorts categories by sort_order then name', () => {
    const categories = buildServiceCategoriesFromRows([
      { id: 'cat-b', name: 'RVs', sort_order: 10, created_at: '2026-01-02T00:00:00Z' },
      { id: 'cat-a', name: 'Cars', sort_order: 0, created_at: '2026-01-01T00:00:00Z' },
    ]);

    expect(categories).toEqual([
      expect.objectContaining({ id: 'cat-a', name: 'Cars', sortOrder: 0 }),
      expect.objectContaining({ id: 'cat-b', name: 'RVs', sortOrder: 10 }),
    ]);
  });

  it('skips invalid rows', () => {
    expect(buildServiceCategoriesFromRows([{ id: 'x', name: '' }])).toEqual([]);
  });
});

describe('buildServiceCategoryByIdFromServiceRows', () => {
  it('maps service ids to category ids', () => {
    expect(
      buildServiceCategoryByIdFromServiceRows([
        { id: 'svc-1', category_id: 'cat-a' },
        { id: 'svc-2', category_id: null },
        { id: 'svc-3' },
      ]),
    ).toEqual({ 'svc-1': 'cat-a' });
  });
});

describe('buildCategorySelectOptionsWithNone', () => {
  it('prepends None option', () => {
    const options = buildCategorySelectOptionsWithNone([{ id: 'cat-a', name: 'Cars' }]);
    expect(options[0].label).toBe('None');
    expect(options[1]).toEqual({ value: 'cat-a', label: 'Cars' });
  });
});
