import { fetchBookingAssignees } from '../api/fetchBookingAssignees';
import { bookingAssigneesQueryKey } from '../../queryKeys';
import { canShowAssigneeControl } from './mapBookingAssignees';
import { readAssignedUserId } from './readAssignedUserId';

/**
 * @param {object[] | null | undefined} rows
 * @param {{ nameByUserId?: Map<string, string>; canAssign?: boolean } | null | undefined} directory
 */
export function applyAssigneeDisplay(rows, directory) {
  const nameByUserId = directory?.nameByUserId ?? new Map();
  const canAssign = Boolean(directory?.canAssign);
  return (rows ?? []).map((row) => {
    const assignedUserId = readAssignedUserId(row);
    return {
      ...row,
      assigned_user_name: assignedUserId ? (nameByUserId.get(assignedUserId) ?? null) : null,
      shop_can_assign: canAssign,
    };
  });
}

/**
 * @param {import('./mapBookingAssignees').BookingAssignee[] | null | undefined} assignees
 */
export function directoryFromAssignees(assignees) {
  const rows = assignees ?? [];
  return {
    nameByUserId: new Map(rows.map((row) => [row.userId, row.label])),
    canAssign: canShowAssigneeControl(rows),
  };
}

/**
 * Resolves names with the same assignee query the picker uses, then stamps the rows.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {{
 *   accessToken?: string | null;
 *   userId?: string | null;
 *   rows?: object[] | null;
 * }} input
 */
export async function stampBookingsWithAssigneeQuery(queryClient, input) {
  const rows = input?.rows ?? [];
  const accessToken = input?.accessToken;
  const userId = input?.userId;
  if (!rows.length || !queryClient || !accessToken || !userId) {
    return rows;
  }
  try {
    const assignees = await queryClient.fetchQuery({
      queryKey: bookingAssigneesQueryKey(userId),
      queryFn: async () => {
        const result = await fetchBookingAssignees(accessToken, { userId });
        return result.assignees ?? [];
      },
      staleTime: 60 * 1000,
    });
    return applyAssigneeDisplay(rows, directoryFromAssignees(assignees));
  } catch {
    return rows;
  }
}
