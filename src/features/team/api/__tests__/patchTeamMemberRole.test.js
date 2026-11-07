import { mapTeamRoleHttpError, patchTeamMemberRole } from '../patchTeamMemberRole';
import { TEAM_MEMBER_NOT_FOUND } from '../../constants/teamMembersCopy';

jest.mock('../../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://myservicelink.app',
}));

jest.mock('../../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('patchTeamMemberRole', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('PATCHes id, source, and role with Bearer auth', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, role: 'manager' }),
    });

    const result = await patchTeamMemberRole('token-1', {
      id: 'mem-1',
      source: 'member',
      role: 'manager',
    });

    expect(result).toEqual({ ok: true, role: 'manager' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/team/members',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ id: 'mem-1', source: 'member', role: 'manager' }),
      }),
    );
  });

  it('updates a pending invite by invite id', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, role: 'coordinator' }),
    });

    await patchTeamMemberRole('token-1', { id: 'inv-1', source: 'invite', role: 'coordinator' });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      id: 'inv-1',
      source: 'invite',
      role: 'coordinator',
    });
  });

  it('does not send email, name, or businessId', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, role: 'member' }),
    });

    await patchTeamMemberRole('token-1', {
      id: 'mem-1',
      source: 'member',
      role: 'member',
      email: 'sam@shop.com',
      name: 'Sam',
      businessId: 'biz-1',
    });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      id: 'mem-1',
      source: 'member',
      role: 'member',
    });
  });

  it('surfaces a 403 as owner-only', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'Not allowed' }),
    });

    const result = await patchTeamMemberRole('token-1', {
      id: 'mem-1',
      source: 'member',
      role: 'manager',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(403);
      expect(result.userMessage).toBe('Not allowed');
    }
  });

  it('rejects a missing session', async () => {
    const result = await patchTeamMemberRole(null, {
      id: 'mem-1',
      source: 'member',
      role: 'manager',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.userMessage).toMatch(/sign in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('mapTeamRoleHttpError', () => {
  it('prefers the server message and falls back by status', () => {
    expect(mapTeamRoleHttpError(404, null)).toBe(TEAM_MEMBER_NOT_FOUND);
    expect(mapTeamRoleHttpError(403, null)).toMatch(/owner/i);
    expect(mapTeamRoleHttpError(400, 'Invalid role')).toBe('Invalid role');
  });
});
