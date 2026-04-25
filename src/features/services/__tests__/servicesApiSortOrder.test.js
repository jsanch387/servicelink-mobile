jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { saveBusinessServicesSortOrder } from '../api/services';

function buildUpdateChain(error = null) {
  const secondEq = jest.fn().mockResolvedValue({ error });
  const firstEq = jest.fn(() => ({ eq: secondEq }));
  const update = jest.fn(() => ({ eq: firstEq }));
  const from = jest.fn(() => ({ update }));

  return { from, update, firstEq, secondEq };
}

describe('saveBusinessServicesSortOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates each service row order using update + eq filters', async () => {
    const chain = buildUpdateChain();
    supabase.from.mockImplementation(chain.from);

    const { error } = await saveBusinessServicesSortOrder({
      businessId: 'biz-1',
      orderedServiceIds: ['svc-a', 'svc-b', 'svc-c'],
    });

    expect(error).toBeNull();
    expect(supabase.from).toHaveBeenCalledTimes(3);
    expect(chain.update).toHaveBeenCalledTimes(3);

    expect(chain.update.mock.calls[0][0]).toEqual(expect.objectContaining({ sort_order: 0 }));
    expect(chain.update.mock.calls[1][0]).toEqual(expect.objectContaining({ sort_order: 10 }));
    expect(chain.update.mock.calls[2][0]).toEqual(expect.objectContaining({ sort_order: 20 }));

    expect(chain.firstEq).toHaveBeenNthCalledWith(1, 'id', 'svc-a');
    expect(chain.firstEq).toHaveBeenNthCalledWith(2, 'id', 'svc-b');
    expect(chain.firstEq).toHaveBeenNthCalledWith(3, 'id', 'svc-c');
    expect(chain.secondEq).toHaveBeenNthCalledWith(1, 'business_id', 'biz-1');
  });

  it('returns first update error and stops further writes', async () => {
    const okChain = buildUpdateChain();
    const errorObj = { message: 'db fail' };
    const failChain = buildUpdateChain(errorObj);
    let call = 0;
    supabase.from.mockImplementation(() => {
      call += 1;
      return call === 2 ? failChain.from() : okChain.from();
    });

    const result = await saveBusinessServicesSortOrder({
      businessId: 'biz-1',
      orderedServiceIds: ['svc-a', 'svc-b', 'svc-c'],
    });

    expect(result.error).toBe(errorObj);
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });
});
