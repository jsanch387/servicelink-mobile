import { mapTeamInviteHttpError, postTeamInvite } from '../api/postTeamInvite';
import {
  TEAM_INVITE_DUPLICATE_EMAIL,
  TEAM_INVITE_INVALID_EMAIL,
} from '../constants/teamMembersCopy';

jest.mock('../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://myservicelink.app',
}));

jest.mock('../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

describe('postTeamInvite', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('POSTs email with Bearer auth', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ ok: true }),
    });

    const result = await postTeamInvite('token-1', 'sam@example.com', 'Sam');

    expect(result).toEqual({ ok: true, resent: false, name: '', inviteId: null });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://myservicelink.app/api/team/invites',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-1',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ email: 'sam@example.com', name: 'Sam' }),
      }),
    );
  });

  it('marks a resend', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, resent: true }),
    });

    const result = await postTeamInvite('token-1', 'sam@example.com');
    expect(result).toEqual({ ok: true, resent: true, name: '', inviteId: null });
  });

  it('reads the saved name from the invite payload', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        ok: true,
        invite: { id: 'inv-1', email: 'sam@example.com', name: 'Sam Rivera', status: 'pending' },
      }),
    });

    const result = await postTeamInvite('token-1', 'sam@example.com', 'Sam Rivera');
    expect(result).toEqual({
      ok: true,
      resent: false,
      name: 'Sam Rivera',
      inviteId: 'inv-1',
    });
  });

  it('surfaces a 409 as already on the team', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: TEAM_INVITE_DUPLICATE_EMAIL }),
    });

    const result = await postTeamInvite('token-1', 'jordan@example.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
      expect(result.userMessage).toBe(TEAM_INVITE_DUPLICATE_EMAIL);
    }
  });

  it('rejects a missing session', async () => {
    const result = await postTeamInvite(null, 'sam@example.com');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.userMessage).toMatch(/sign in/i);
    }
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('mapTeamInviteHttpError', () => {
  it('prefers the server message and falls back by status', () => {
    expect(mapTeamInviteHttpError(400, null)).toBe(TEAM_INVITE_INVALID_EMAIL);
    expect(mapTeamInviteHttpError(400, 'You cannot invite yourself.')).toBe(
      'You cannot invite yourself.',
    );
    expect(mapTeamInviteHttpError(403, null)).toMatch(/owner/i);
  });
});
