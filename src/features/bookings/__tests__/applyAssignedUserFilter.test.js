import { applyAssignedUserFilter } from '../api/bookings';

describe('applyAssignedUserFilter', () => {
  it('does not constrain the query when no assignee is set', () => {
    const eq = jest.fn();
    const query = { eq };
    expect(applyAssignedUserFilter(query, null)).toBe(query);
    expect(applyAssignedUserFilter(query, '')).toBe(query);
    expect(eq).not.toHaveBeenCalled();
  });

  it('filters to the assigned user', () => {
    const next = { filtered: true };
    const query = { eq: jest.fn(() => next) };
    expect(applyAssignedUserFilter(query, ' user-1 ')).toBe(next);
    expect(query.eq).toHaveBeenCalledWith('assigned_user_id', 'user-1');
  });

  it('includes unassigned jobs when asked', () => {
    const next = { filtered: true };
    const query = { or: jest.fn(() => next) };
    expect(applyAssignedUserFilter(query, 'user-1', { includeUnassigned: true })).toBe(next);
    expect(query.or).toHaveBeenCalledWith('assigned_user_id.is.null,assigned_user_id.eq.user-1');
  });
});
