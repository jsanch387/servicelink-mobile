import { QueryClient } from '@tanstack/react-query';
import { bookingsDetailsQueryKey } from '../../../queryKeys';
import { patchAssignedUserIdInDetailsCache } from '../patchAssignedUserIdInDetailsCache';

describe('patchAssignedUserIdInDetailsCache', () => {
  it('writes assigned_user_id onto the details row', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(bookingsDetailsQueryKey('book-1'), {
      id: 'book-1',
      assigned_user_id: null,
    });

    patchAssignedUserIdInDetailsCache(queryClient, 'book-1', 'member-1');

    expect(queryClient.getQueryData(bookingsDetailsQueryKey('book-1'))).toEqual({
      id: 'book-1',
      assigned_user_id: 'member-1',
      assignedUserId: 'member-1',
    });
  });
});
