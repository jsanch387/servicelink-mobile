import { useMemo, useState } from 'react';
import { DetailsLeadRow, DetailsSectionCard } from '../../../../components/ui';
import { useBookingAssignees } from '../hooks/useBookingAssignees';
import { usePatchBookingAssignee } from '../hooks/usePatchBookingAssignee';
import { BookingAssigneePickerSheet } from './BookingAssigneePickerSheet';

/**
 * @param {{
 *   bookingId?: string | null;
 *   assignedUserId?: string | null;
 *   bookingStatus?: string | null;
 *   embedded?: boolean;
 * }} props
 */
export function BookingAssigneeSection({
  bookingId = null,
  assignedUserId = null,
  bookingStatus = null,
  embedded = false,
}) {
  const assignees = useBookingAssignees();
  const patch = usePatchBookingAssignee(bookingId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingUserId, setPendingUserId] = useState(
    /** @type {string | null | undefined} */ (undefined),
  );

  const selectedUserId = pendingUserId === undefined ? assignedUserId : pendingUserId;
  const statusLower = String(bookingStatus ?? '').toLowerCase();
  const isLocked =
    statusLower === 'completed' ||
    statusLower === 'complete' ||
    statusLower === 'cancelled' ||
    statusLower === 'canceled';
  const canPick = Boolean(bookingId) && assignees.canAssign && !isLocked;
  const assignedLabel = assignees.labelFor(assignedUserId);
  const label = assignees.labelFor(selectedUserId) || 'Unassigned';

  const row = useMemo(
    () => (
      <DetailsLeadRow
        accessibilityLabel={canPick ? 'Change assignee' : 'Assignee'}
        compact={embedded}
        icon="person"
        primary={label}
        showChevron={canPick}
        onPress={
          canPick
            ? () => {
                patch.resetAssignError();
                setSheetOpen(true);
              }
            : undefined
        }
      />
    ),
    [canPick, embedded, label, patch],
  );

  if (assignees.isLoading && !assignees.canAssign) {
    return null;
  }
  // Solo shop: no team to assign. Keep the row only when a name is already on the job.
  if (!assignees.canAssign && !assignedLabel) {
    return null;
  }

  async function handleSelect(userId) {
    const current = typeof assignedUserId === 'string' ? assignedUserId.trim() : '';
    const next = typeof userId === 'string' ? userId.trim() : '';
    if (current === next) {
      setSheetOpen(false);
      return;
    }
    setPendingUserId(userId ?? null);
    try {
      await patch.assignBooking(userId ?? null);
      setSheetOpen(false);
    } catch {
      // Error stays in the sheet so the member can pick again.
    } finally {
      setPendingUserId(undefined);
    }
  }

  const sheet = (
    <BookingAssigneePickerSheet
      errorMessage={patch.assignError}
      options={assignees.pickerOptions}
      saving={patch.isAssigning}
      selectedUserId={selectedUserId}
      visible={sheetOpen}
      onRequestClose={() => {
        if (patch.isAssigning) {
          return;
        }
        patch.resetAssignError();
        setSheetOpen(false);
      }}
      onSelect={(userId) => {
        void handleSelect(userId);
      }}
    />
  );

  if (embedded) {
    return (
      <>
        {row}
        {sheet}
      </>
    );
  }

  return (
    <>
      <DetailsSectionCard bodyPadding="roomy" title="Assignee">
        {row}
      </DetailsSectionCard>
      {sheet}
    </>
  );
}
