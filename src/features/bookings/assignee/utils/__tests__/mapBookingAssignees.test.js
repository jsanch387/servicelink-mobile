import {
  buildAssignablePickerOptions,
  canShowAssigneeControl,
  mapBookingAssignees,
  mergeAssigneesKeepingFormer,
  presentAssigneeDisplay,
  resolveAssigneeLabel,
} from '../mapBookingAssignees';
import { readAssignedUserId } from '../readAssignedUserId';

describe('mapBookingAssignees', () => {
  const owner = { userId: 'owner-1', label: 'Owner', kind: 'owner' };
  const member = { userId: 'mem-1', label: 'sam@shop.com', kind: 'member' };
  const former = { userId: 'old-1', label: 'old@shop.com', kind: 'former' };

  it('maps API rows and fills a missing owner label', () => {
    expect(
      mapBookingAssignees({
        success: true,
        assignees: [
          { userId: 'owner-1', kind: 'owner' },
          { userId: 'mem-1', label: 'sam@shop.com', kind: 'member' },
        ],
      }),
    ).toEqual([{ userId: 'owner-1', label: 'Owner', kind: 'owner' }, member]);
  });

  it('skips rows that would be a blank chip', () => {
    expect(mapBookingAssignees([{ userId: 'mem-1', kind: 'member' }])).toEqual([]);
  });

  it('shows the assignee control only when the shop has more than one person', () => {
    expect(canShowAssigneeControl([owner])).toBe(false);
    expect(canShowAssigneeControl([member])).toBe(false);
    expect(canShowAssigneeControl([owner, member])).toBe(true);
  });

  it('never returns a blank label', () => {
    expect(resolveAssigneeLabel(null, [owner, member])).toBeNull();
    expect(resolveAssigneeLabel('owner-1', [owner, member], 'owner-1')).toBe('Myself');
    expect(resolveAssigneeLabel('owner-1', [owner, member], 'mem-1')).toBe('Owner');
    expect(resolveAssigneeLabel('unknown', [owner, member])).toBeNull();
  });

  it('shows a short name instead of the full email', () => {
    expect(resolveAssigneeLabel('mem-1', [owner, member])).toBe('Sam');
    expect(resolveAssigneeLabel('mem-1', [owner, member], 'mem-1')).toBe('Myself');
    expect(presentAssigneeDisplay('jesus.sanchez@shop.com')).toEqual({
      title: 'Jesus Sanchez',
      subtitle: 'jesus.sanchez@shop.com',
      initial: 'J',
    });
  });

  it('still labels a removed teammate on past jobs', () => {
    expect(resolveAssigneeLabel('old-1', [owner, former])).toBe('Old');
  });

  it('keeps former teammates when the API list omitted them', () => {
    expect(mergeAssigneesKeepingFormer([owner, member], [former, member])).toEqual([
      owner,
      member,
      former,
    ]);
  });

  it('builds picker options with Unassigned, owner, and active members', () => {
    expect(buildAssignablePickerOptions([owner, member, former], 'owner-1')).toEqual([
      { userId: null, label: 'Unassigned', kind: 'unassigned' },
      { ...owner, label: 'Myself' },
      member,
    ]);
    expect(buildAssignablePickerOptions([owner, member, former], 'mem-1')).toEqual([
      { userId: null, label: 'Unassigned', kind: 'unassigned' },
      owner,
      { ...member, label: 'Myself' },
    ]);
  });

  it('reads assigned_user_id or assignedUserId', () => {
    expect(readAssignedUserId({ assigned_user_id: 'u1' })).toBe('u1');
    expect(readAssignedUserId({ assignedUserId: 'u2' })).toBe('u2');
    expect(readAssignedUserId({})).toBeNull();
  });
});
