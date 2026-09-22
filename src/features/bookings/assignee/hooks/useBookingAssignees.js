import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../../../auth';
import { bookingAssigneesQueryKey } from '../../queryKeys';
import { fetchBookingAssignees } from '../api/fetchBookingAssignees';
import {
  buildAssignablePickerOptions,
  canShowAssigneeControl,
  resolveAssigneeLabel,
} from '../utils/mapBookingAssignees';

export function useBookingAssignees() {
  const { user, session } = useAuth();
  const userId = user?.id;
  const accessToken = session?.access_token;

  const query = useQuery({
    queryKey: bookingAssigneesQueryKey(userId),
    queryFn: async () => {
      const result = await fetchBookingAssignees(accessToken, { userId });
      return result.assignees ?? [];
    },
    enabled: Boolean(userId && accessToken),
    staleTime: 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  return useMemo(() => {
    const assignees = query.data ?? [];
    return {
      assignees,
      canAssign: canShowAssigneeControl(assignees),
      pickerOptions: buildAssignablePickerOptions(assignees),
      labelFor: (assignedUserId) => resolveAssigneeLabel(assignedUserId, assignees),
      isLoading: query.isLoading,
    };
  }, [query.data, query.isLoading, userId]);
}
