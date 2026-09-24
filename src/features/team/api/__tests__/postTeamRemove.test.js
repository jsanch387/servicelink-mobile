import { mapTeamRemoveHttpError, postTeamRemove } from '../postTeamRemove';
import { TEAM_MEMBER_NOT_FOUND } from '../../constants/teamMembersCopy';

jest.mock('../../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://myservicelink.app',
}));

jest.mock('../../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postTeamRemove', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('POSTs the list row id and source with Bearer auth', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await postTeamRemove('token-1', { id: 'mem-1', source: 'member' });

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/team/remove',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ id: 'mem-1', source: 'member' }),
      }),
    );
  });

  it('revokes a pending invite by invite id', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await postTeamRemove('token-1', { id: 'inv-1', source: 'invite' });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/team/remove',
      expect.objectContaining({
        body: JSON.stringify({ id: 'inv-1', source: 'invite' }),
      }),
    );
  });

  it('does not send email, user_id, or businessId', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    await postTeamRemove('token-1', {
      id: 'mem-1',
      source: 'member',
      email: 'sam@shop.com',
      userId: 'user-1',
      user_id: 'user-1',
    });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      id: 'mem-1',
      source: 'member',
    });
  });

  it('surfaces a 403 as owner-only', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ success: false, error: 'Not allowed' }),
    });

    const result = await postTeamRemove('token-1', { id: 'mem-1', source: 'member' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(403);
      expect(result.userMessage).toBe('Not allowed');
    }
  });

  it('rejects a missing session', async () => {
    const result = await postTeamRemove(null, { id: 'mem-1', source: 'member' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.userMessage).toMatch(/sign in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a bad list row before calling the server', async () => {
    const result = await postTeamRemove('token-1', { id: 'mem-1', source: 'email' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(0);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('mapTeamRemoveHttpError', () => {
  it('prefers the server message and falls back by status', () => {
    expect(mapTeamRemoveHttpError(404, null)).toBe(TEAM_MEMBER_NOT_FOUND);
    expect(mapTeamRemoveHttpError(403, null)).toMatch(/owner/i);
    expect(mapTeamRemoveHttpError(400, 'Bad source')).toBe('Bad source');
  });
});
