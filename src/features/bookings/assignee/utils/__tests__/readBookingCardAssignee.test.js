import { applyAssigneeDisplay } from '../attachAssigneeDisplayToBookings';
import { buildAssigneesFromShopRoster } from '../buildAssigneesFromShopRoster';
import { readBookingCardAssignee } from '../readBookingCardAssignee';

describe('buildAssigneesFromShopRoster', () => {
  it('uses the invite name and keeps a removed teammate', () => {
    expect(
      buildAssigneesFromShopRoster({
        ownerUserId: 'owner-1',
        members: [
          { user_id: 'mem-1', status: 'active' },
          { user_id: 'old-1', status: 'removed' },
        ],
        invites: [
          { email: 'sam@shop.com', name: 'Sam Rivera', accepted_user_id: 'mem-1' },
          { email: 'old@shop.com', accepted_user_id: 'old-1' },
        ],
      }),
    ).toEqual([
      { userId: 'owner-1', label: 'Owner', kind: 'owner' },
      { userId: 'mem-1', label: 'Sam Rivera', kind: 'member' },
      { userId: 'old-1', label: 'old@shop.com', kind: 'former' },
    ]);
  });

  it('still counts an active member when the invite email is missing', () => {
    expect(
      buildAssigneesFromShopRoster({
        ownerUserId: 'owner-1',
        members: [{ user_id: 'mem-1', status: 'active' }],
        invites: [],
      }),
    ).toEqual([
      { userId: 'owner-1', label: 'Owner', kind: 'owner' },
      { userId: 'mem-1', label: 'Member', kind: 'member' },
    ]);
  });
});

describe('applyAssigneeDisplay', () => {
  it('stamps the roster name and team flag onto each booking', () => {
    const nameByUserId = new Map([
      ['owner-1', 'Owner'],
      ['mem-1', 'Sam Rivera'],
    ]);
    expect(
      applyAssigneeDisplay(
        [
          { id: 'b1', assigned_user_id: 'mem-1' },
          { id: 'b2', assigned_user_id: null },
        ],
        { nameByUserId, canAssign: true },
      ),
    ).toEqual([
      {
        id: 'b1',
        assigned_user_id: 'mem-1',
        assigned_user_name: 'Sam Rivera',
        shop_can_assign: true,
      },
      {
        id: 'b2',
        assigned_user_id: null,
        assigned_user_name: null,
        shop_can_assign: true,
      },
    ]);
  });
});

describe('readBookingCardAssignee', () => {
  it('reads the name from the booking and shortens it', () => {
    expect(
      readBookingCardAssignee(
        {
          assigned_user_id: 'mem-1',
          assigned_user_name: 'Jordan Lee',
          shop_can_assign: true,
        },
        'owner-1',
      ),
    ).toEqual({ initial: 'J', name: 'Jordan' });
  });

  it('labels the signed-in user as Myself', () => {
    expect(
      readBookingCardAssignee(
        {
          assigned_user_id: 'owner-1',
          assigned_user_name: 'Owner',
          shop_can_assign: true,
        },
        'owner-1',
      ),
    ).toEqual({ initial: 'M', name: 'Myself' });
  });

  it('hides the chip on a solo shop', () => {
    expect(
      readBookingCardAssignee(
        {
          assigned_user_id: 'owner-1',
          assigned_user_name: 'Owner',
          shop_can_assign: false,
        },
        'owner-1',
      ),
    ).toBeNull();
  });

  it('falls back to the shop roster when the booking was not stamped', () => {
    expect(
      readBookingCardAssignee({ assigned_user_id: 'mem-1' }, 'owner-1', {
        canAssign: true,
        labelFor: () => 'Jordan Lee',
      }),
    ).toEqual({ initial: 'J', name: 'Jordan' });
  });
});
