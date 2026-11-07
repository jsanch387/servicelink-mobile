jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { updateMembershipSubscriberNotes } from '../api/updateMembershipSubscriberNotes';

function mockUpdateChain(result) {
  const maybeSingle = jest.fn().mockResolvedValue(result);
  const select = jest.fn(() => ({ maybeSingle }));
  const eqId = jest.fn(() => ({ select }));
  const eqBusiness = jest.fn(() => ({ eq: eqId }));
  const update = jest.fn(() => ({ eq: eqBusiness }));
  supabase.from.mockReturnValue({ update });
  return { update, eqBusiness, eqId };
}

describe('updateMembershipSubscriberNotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates customer_memberships notes for the owner business', async () => {
    const chain = mockUpdateChain({
      data: { id: 'sub-1', notes: 'Prefers weekdays in the morning' },
      error: null,
    });

    const { data, error } = await updateMembershipSubscriberNotes(
      'biz-1',
      'sub-1',
      '  Prefers weekdays in the morning  ',
    );

    expect(error).toBeNull();
    expect(data).toEqual({ id: 'sub-1', notes: 'Prefers weekdays in the morning' });
    expect(supabase.from).toHaveBeenCalledWith('customer_memberships');
    expect(chain.update).toHaveBeenCalledWith({ notes: 'Prefers weekdays in the morning' });
    expect(chain.eqBusiness).toHaveBeenCalledWith('business_id', 'biz-1');
    expect(chain.eqId).toHaveBeenCalledWith('id', 'sub-1');
  });

  it('clears notes when the draft is blank', async () => {
    const chain = mockUpdateChain({ data: { id: 'sub-1', notes: null }, error: null });

    await updateMembershipSubscriberNotes('biz-1', 'sub-1', '   ');

    expect(chain.update).toHaveBeenCalledWith({ notes: null });
  });

  it('rejects missing ids without calling supabase', async () => {
    const result = await updateMembershipSubscriberNotes('', 'sub-1', 'Hi');
    expect(result.error?.message).toMatch(/business/i);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('fails closed when RLS matches no row (silent 0-row update)', async () => {
    mockUpdateChain({ data: null, error: null });

    const { data, error } = await updateMembershipSubscriberNotes('biz-1', 'sub-1', 'Gate code');

    expect(data).toBeNull();
    expect(error?.message).toBe('Could not save notes.');
  });
});
