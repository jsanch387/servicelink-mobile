import { mapTeamRoster } from '../utils/mapTeamRoster';

describe('mapTeamRoster', () => {
  it('lists pending invites and active members with invite email', () => {
    const rows = mapTeamRoster({
      invites: [
        {
          id: 'inv-pending',
          email: 'Alex@Example.com',
          status: 'pending',
          accepted_user_id: null,
          created_at: '2026-09-02T00:00:00.000Z',
        },
        {
          id: 'inv-accepted',
          email: 'Jordan@Example.com',
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
        status: 'invited',
      }),
      expect.objectContaining({
        id: 'mem-jordan',
        email: 'jordan@example.com',
        status: 'active',
      }),
    ]);
  });

  it('returns an empty list when the shop has no hires', () => {
    expect(mapTeamRoster({ invites: [], members: [] })).toEqual([]);
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
