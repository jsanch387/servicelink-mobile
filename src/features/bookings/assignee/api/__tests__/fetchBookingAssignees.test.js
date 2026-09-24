jest.mock('../../../../../lib/stripeMobileCheckoutOrigin', () => ({
  resolveStripeMobileCheckoutOrigin: () => 'https://app.example.com',
}));

jest.mock('../../../../../lib/productionWebApiHttpsGuard', () => ({
  productionWebApiHttpsGuard: () => null,
}));

jest.mock('../../../../home/api/homeDashboard', () => ({
  fetchBusinessProfileForUser: jest.fn(),
}));

jest.mock('../../../../../lib/supabase', () => ({
  supabase: { from: jest.fn() },
}));

import { fetchBusinessProfileForUser } from '../../../../home/api/homeDashboard';
import { fetchBookingAssignees } from '../fetchBookingAssignees';

function thenableQuery(result) {
  const resolved = Promise.resolve(result);
  const builder = {
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    in: jest.fn(() => builder),
    maybeSingle: jest.fn(() => resolved),
    then: (onFulfilled, onRejected) => resolved.then(onFulfilled, onRejected),
  };
  return builder;
}

function mockShopRoster({ members = [], invites = [], profiles = [] } = {}) {
  fetchBusinessProfileForUser.mockResolvedValue({
    data: { id: 'biz-1', profile_id: 'owner-1' },
    error: null,
  });
  const { supabase } = require('../../../../../lib/supabase');
  supabase.from.mockImplementation((table) => {
    if (table === 'business_profiles') {
      return thenableQuery({ data: { profile_id: 'owner-1' }, error: null });
    }
    if (table === 'business_members') {
      return thenableQuery({ data: members, error: null });
    }
    if (table === 'profiles') {
      return thenableQuery({ data: profiles, error: null });
    }
    return thenableQuery({ data: invites, error: null });
  });
}

describe('fetchBookingAssignees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    mockShopRoster();
  });

  it('loads assignees from the availability API', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        assignees: [
          { userId: 'owner-1', label: 'Owner', kind: 'owner' },
          { userId: 'mem-1', label: 'sam@shop.com', kind: 'member' },
        ],
      }),
    });

    await expect(fetchBookingAssignees('token', { userId: 'owner-1' })).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'mem-1', label: 'Member', kind: 'member', email: 'sam@shop.com' },
      ],
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'https://app.example.com/api/availability/bookings/assignees',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('keeps a removed teammate when the API only returns active people', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        assignees: [
          { userId: 'owner-1', label: 'Owner', kind: 'owner' },
          { userId: 'mem-1', label: 'sam@shop.com', kind: 'member' },
        ],
      }),
    });
    mockShopRoster({
      members: [
        { user_id: 'mem-1', status: 'active' },
        { user_id: 'old-1', status: 'removed' },
      ],
      invites: [
        { email: 'sam@shop.com', accepted_user_id: 'mem-1', status: 'accepted' },
        { email: 'old@shop.com', accepted_user_id: 'old-1', status: 'accepted' },
      ],
    });

    await expect(fetchBookingAssignees('token', { userId: 'owner-1' })).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'mem-1', label: 'Member', kind: 'member', email: 'sam@shop.com' },
        { userId: 'old-1', label: 'Member', kind: 'former', email: 'old@shop.com' },
      ],
    });
  });

  it('does not let a shop Member placeholder overwrite a stored name', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        assignees: [
          { userId: 'owner-1', label: 'Owner', kind: 'owner' },
          { userId: 'mem-1', label: 'Sam Rivera', kind: 'member', email: 'sam@shop.com' },
        ],
      }),
    });
    mockShopRoster({
      members: [{ user_id: 'mem-1', status: 'active' }],
      invites: [],
    });

    await expect(fetchBookingAssignees('token', { userId: 'owner-1' })).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'mem-1', label: 'Sam Rivera', kind: 'member', email: 'sam@shop.com' },
      ],
    });
  });

  it('uses the shop-set invite name instead of Member or the account name', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        assignees: [
          { userId: 'owner-1', label: 'Owner', kind: 'owner' },
          { userId: 'mem-1', label: 'Member', kind: 'member' },
        ],
      }),
    });
    mockShopRoster({
      members: [{ user_id: 'mem-1', status: 'active' }],
      invites: [
        {
          email: 'jordan@shop.com',
          name: 'Alex',
          accepted_user_id: 'mem-1',
          status: 'accepted',
        },
      ],
    });

    await expect(
      fetchBookingAssignees('token', {
        userId: 'mem-1',
        viewer: { userId: 'mem-1', name: 'Jordan Lee', email: 'jordan@shop.com' },
      }),
    ).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'mem-1', label: 'Alex', kind: 'member', email: 'jordan@shop.com' },
      ],
    });
  });

  it('matches the shop-set name by the signed-in teammate email', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        assignees: [
          { userId: 'owner-1', label: 'Owner', kind: 'owner' },
          { userId: 'mem-1', label: 'Member', kind: 'member' },
        ],
      }),
    });
    mockShopRoster({
      members: [{ user_id: 'mem-1', status: 'active' }],
      invites: [{ email: 'jordan@shop.com', name: 'Alex', status: 'accepted' }],
    });

    await expect(
      fetchBookingAssignees('token', {
        userId: 'mem-1',
        viewer: { userId: 'mem-1', name: 'Jordan Lee', email: 'jordan@shop.com' },
      }),
    ).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'mem-1', label: 'Alex', kind: 'member', email: 'jordan@shop.com' },
      ],
    });
  });

  it('prefers the invite name over the email for assignees', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    mockShopRoster({
      members: [{ user_id: 'mem-1', status: 'active' }],
      invites: [
        {
          email: 'sam@shop.com',
          name: 'Sam Rivera',
          accepted_user_id: 'mem-1',
          status: 'accepted',
        },
      ],
    });

    await expect(fetchBookingAssignees('token', { userId: 'owner-1' })).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'mem-1', label: 'Sam Rivera', kind: 'member', email: 'sam@shop.com' },
      ],
    });
  });

  it('falls back to Supabase when the API is unavailable', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    mockShopRoster({
      members: [{ user_id: 'mem-1', status: 'active' }],
      invites: [{ email: 'sam@shop.com', accepted_user_id: 'mem-1', status: 'accepted' }],
    });

    await expect(fetchBookingAssignees('token', { userId: 'owner-1' })).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'mem-1', label: 'Member', kind: 'member', email: 'sam@shop.com' },
      ],
    });
  });

  it('labels a removed teammate from the shop roster when the API is down', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) });
    mockShopRoster({
      members: [{ user_id: 'old-1', status: 'removed' }],
      invites: [{ email: 'old@shop.com', accepted_user_id: 'old-1', status: 'accepted' }],
    });

    await expect(fetchBookingAssignees('token', { userId: 'owner-1' })).resolves.toEqual({
      assignees: [
        { userId: 'owner-1', label: 'Owner', kind: 'owner' },
        { userId: 'old-1', label: 'Member', kind: 'former', email: 'old@shop.com' },
      ],
    });
  });
});
