jest.mock('../../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { supabase } from '../../../../lib/supabase';
import { persistTeamInviteName, updateTeamMemberDisplayName } from '../persistTeamInviteName';

function invitesQuery({ rows = [], findError = null, updateError = null } = {}) {
  const findResult = Promise.resolve({ data: rows, error: findError });
  const updateResult = Promise.resolve({ data: null, error: updateError });
  const builder = {
    select: jest.fn(() => builder),
    update: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    then: (onFulfilled, onRejected) => {
      const pending = builder.update.mock.calls.length > 0 ? updateResult : findResult;
      return pending.then(onFulfilled, onRejected);
    },
  };
  return builder;
}

describe('persistTeamInviteName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates the pending invite by id when the stored email casing differs', async () => {
    const query = invitesQuery({
      rows: [{ id: 'inv-1', email: 'Sam@Example.com' }],
    });
    supabase.from.mockReturnValue(query);

    await persistTeamInviteName('biz-1', 'sam@example.com', 'Sam Rivera');

    expect(supabase.from).toHaveBeenCalledWith('team_invites');
    expect(query.update).toHaveBeenCalledWith({ name: 'Sam Rivera' });
    expect(query.eq).toHaveBeenCalledWith('id', 'inv-1');
  });

  it('does not write when no pending invite matches the email', async () => {
    const query = invitesQuery({
      rows: [{ id: 'inv-2', email: 'alex@example.com' }],
    });
    supabase.from.mockReturnValue(query);

    await persistTeamInviteName('biz-1', 'sam@example.com', 'Sam Rivera');

    expect(query.update).not.toHaveBeenCalled();
  });
});

describe('updateTeamMemberDisplayName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates a pending invite by row id', async () => {
    const query = invitesQuery();
    supabase.from.mockReturnValue(query);

    await updateTeamMemberDisplayName(
      'biz-1',
      { id: 'inv-1', source: 'invite', email: 'sam@example.com' },
      'Sam Rivera',
    );

    expect(query.update).toHaveBeenCalledWith({ name: 'Sam Rivera' });
    expect(query.eq).toHaveBeenCalledWith('id', 'inv-1');
  });

  it('updates an active hire by accepted user id', async () => {
    const query = invitesQuery();
    supabase.from.mockReturnValue(query);

    await updateTeamMemberDisplayName(
      'biz-1',
      { id: 'mem-1', source: 'member', userId: 'user-1', email: 'jordan@example.com' },
      'Jordan Lee',
    );

    expect(query.update).toHaveBeenCalledWith({ name: 'Jordan Lee' });
    expect(query.eq).toHaveBeenCalledWith('accepted_user_id', 'user-1');
  });
});
