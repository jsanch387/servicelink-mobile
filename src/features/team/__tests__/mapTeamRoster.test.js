import { applyInviteNameToRoster, mapTeamRoster } from '../utils/mapTeamRoster';

describe('mapTeamRoster', () => {
  it('lists pending invites and active members with invite email', () => {
    const rows = mapTeamRoster({
      invites: [
        {
          id: 'inv-pending',
          email: 'Alex@Example.com',
          name: 'Alex Rivera',
          status: 'pending',
          accepted_user_id: null,
          created_at: '2026-09-02T00:00:00.000Z',
        },
        {
          id: 'inv-accepted',
          email: 'Jordan@Example.com',
          name: 'Jordan Lee',
          status: 'accepted',
          accepted_user_id: 'user-jordan',
          created_at: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'inv-revoked',
          email: 'old@example.com',
          status: 'revoked',
          accepted_user_id: null,
          created_at: '2026-08-01T00:00:00.000Z',
        },
      ],
      members: [
        {
          id: 'mem-jordan',
          user_id: 'user-jordan',
          status: 'active',
          created_at: '2026-09-01T00:00:00.000Z',
        },
        {
          id: 'mem-gone',
          user_id: 'user-gone',
          status: 'removed',
          created_at: '2026-08-02T00:00:00.000Z',
        },
      ],
    });

    expect(rows).toEqual([
      expect.objectContaining({
        id: 'inv-pending',
        email: 'alex@example.com',
        name: 'Alex Rivera',
        status: 'invited',
        source: 'invite',
      }),
      expect.objectContaining({
        id: 'mem-jordan',
        email: 'jordan@example.com',
        name: 'Jordan Lee',
        status: 'active',
        source: 'member',
      }),
    ]);
  });

  it('returns an empty list when the shop has no hires', () => {
    expect(mapTeamRoster({ invites: [], members: [] })).toEqual([]);
  });

  it('writes the typed invite name onto the matching roster email', () => {
    expect(
      applyInviteNameToRoster(
        {
          shopId: 'biz-1',
          members: [
            { id: 'inv-1', email: 'Sam@Example.com', name: '' },
            { id: 'inv-2', email: 'alex@example.com', name: 'Alex' },
          ],
        },
        'sam@example.com',
        'Sam Rivera',
      ),
    ).toEqual({
      shopId: 'biz-1',
      members: [
        { id: 'inv-1', email: 'Sam@Example.com', name: 'Sam Rivera' },
        { id: 'inv-2', email: 'alex@example.com', name: 'Alex' },
      ],
    });
  });

  it('skips an active member when there is no accepted-invite email', () => {
    expect(
      mapTeamRoster({
        invites: [],
        members: [
          {
            id: 'mem-orphan',
            user_id: 'user-orphan',
            status: 'active',
            created_at: '2026-09-01T00:00:00.000Z',
          },
        ],
      }),
    ).toEqual([]);
  });
});
