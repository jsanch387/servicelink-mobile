jest.mock('../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../lib/supabase';
import { fetchTeamRosterForOwner } from '../api/fetchTeamRosterForOwner';

function thenableQuery(result, { maybeSingle = false } = {}) {
  const resolved = Promise.resolve(result);
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    maybeSingle: jest.fn(() => resolved),
    then: (onFulfilled, onRejected) => resolved.then(onFulfilled, onRejected),
  };
  if (maybeSingle) {
    builder.maybeSingle = jest.fn(() => resolved);
  }
  return builder;
}

describe('fetchTeamRosterForOwner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns no shop when the user has no business profile', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'business_profiles') {
        return thenableQuery({ data: null, error: null }, { maybeSingle: true });
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await fetchTeamRosterForOwner('user-1');
    expect(result).toEqual({ shopId: null, members: [], error: null });
  });

  it('loads pending invites and active members for the shop', async () => {
    supabase.from.mockImplementation((table) => {
      if (table === 'business_profiles') {
        return thenableQuery({ data: { id: 'biz-1' }, error: null }, { maybeSingle: true });
      }
      if (table === 'team_invites') {
        return thenableQuery({
          data: [
            {
              id: 'inv-1',
              email: 'alex@example.com',
              status: 'pending',
              accepted_user_id: null,
              created_at: '2026-09-02T00:00:00.000Z',
            },
          ],
          error: null,
        });
      }
      if (table === 'business_members') {
        return thenableQuery({ data: [], error: null });
      }
      throw new Error(`unexpected table ${table}`);
    });

    const result = await fetchTeamRosterForOwner('user-1');
    expect(result.shopId).toBe('biz-1');
    expect(result.error).toBeNull();
    expect(result.members).toEqual([
      expect.objectContaining({ id: 'inv-1', email: 'alex@example.com', status: 'invited' }),
    ]);
    expect(supabase.from).toHaveBeenCalledWith('team_invites');
    expect(supabase.from).toHaveBeenCalledWith('business_members');
  });
});
