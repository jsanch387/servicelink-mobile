jest.mock('../../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../../lib/supabase';
import {
  fetchServiceCategories,
  insertServiceCategory,
  saveServiceCategoriesSortOrder,
} from '../api/serviceCategories';

describe('fetchServiceCategories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('queries service_categories ordered by sort_order and created_at', async () => {
    const orderCreated = jest.fn().mockResolvedValue({ data: [{ id: 'cat-1' }], error: null });
    const orderSort = jest.fn(() => ({ order: orderCreated }));
    const eq = jest.fn(() => ({ order: orderSort }));
    const select = jest.fn(() => ({ eq }));
    supabase.from.mockReturnValue({ select });

    const result = await fetchServiceCategories('biz-1');

    expect(supabase.from).toHaveBeenCalledWith('service_categories');
    expect(eq).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(orderSort).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(orderCreated).toHaveBeenCalledWith('created_at', { ascending: true });
    expect(result.data).toEqual([{ id: 'cat-1' }]);
    expect(result.error).toBeNull();
  });
});

describe('insertServiceCategory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inserts a row and returns the created record', async () => {
    const created = { id: 'cat-1', name: 'Cars', business_id: 'biz-1', sort_order: 0 };
    const select = jest.fn().mockResolvedValue({ data: [created], error: null });
    const insert = jest.fn(() => ({ select }));
    supabase.from.mockReturnValue({ insert });

    const result = await insertServiceCategory({
      businessId: 'biz-1',
      name: 'Cars',
      sortOrder: 0,
    });

    expect(supabase.from).toHaveBeenCalledWith('service_categories');
    expect(insert).toHaveBeenCalledWith({
      business_id: 'biz-1',
      name: 'Cars',
      sort_order: 0,
    });
    expect(result.data).toEqual(created);
    expect(result.error).toBeNull();
  });
});

function buildUpdateChain(error = null) {
  const secondEq = jest.fn().mockResolvedValue({ error });
  const firstEq = jest.fn(() => ({ eq: secondEq }));
  const update = jest.fn(() => ({ eq: firstEq }));
  const from = jest.fn(() => ({ update }));

  return { from, update, firstEq, secondEq };
}

describe('saveServiceCategoriesSortOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates each category row sort_order using update + eq filters', async () => {
    const chain = buildUpdateChain();
    supabase.from.mockImplementation(chain.from);

    const { error } = await saveServiceCategoriesSortOrder({
      businessId: 'biz-1',
      orderedCategoryIds: ['cat-a', 'cat-b'],
    });

    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(chain.update.mock.calls[0][0]).toEqual(expect.objectContaining({ sort_order: 0 }));
    expect(chain.update.mock.calls[1][0]).toEqual(expect.objectContaining({ sort_order: 10 }));
    expect(chain.firstEq).toHaveBeenNthCalledWith(1, 'id', 'cat-a');
    expect(chain.firstEq).toHaveBeenNthCalledWith(2, 'id', 'cat-b');
    expect(chain.secondEq).toHaveBeenNthCalledWith(1, 'business_id', 'biz-1');
  });
});
