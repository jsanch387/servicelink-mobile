import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DetailsLeadRow, DetailsSectionCard } from '../../../../components/ui';
import { BookingAssigneeSection } from '../../assignee/components/BookingAssigneeSection';

/**
 * When / where / who — one scan block for the visit.
 *
 * @param {object} props
 * @param {{ date?: string | null; time?: string | null; duration?: string | null }} props.schedule
 * @param {{ hasAddress?: boolean; primary?: string; secondary?: string; address?: string }} props.location
 * @param {() => void} [props.onOpenMaps]
 * @param {string | null} [props.bookingId]
 * @param {string | null} [props.assignedUserId]
 * @param {string | null} [props.bookingStatus]
 */
export function BookingVisitSection({
  schedule,
  location,
  onOpenMaps,
  bookingId = null,
  assignedUserId = null,
  bookingStatus = null,
}) {
  const dateLine = String(schedule?.date ?? '').trim();
  const timeLine = String(schedule?.time ?? '').trim();
  const durationLine = String(schedule?.duration ?? '').trim();
  const whenPrimary = dateLine || timeLine || 'Not scheduled';
  const whenSecondary = dateLine
    ? [timeLine, durationLine].filter(Boolean).join(' · ')
    : durationLine;

  const street = String(location?.primary || location?.address || '').trim();
  const locality = String(location?.secondary ?? '').trim();
  const hasAddress = Boolean(location?.hasAddress && street);
  const mapsInteractive = hasAddress && typeof onOpenMaps === 'function';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 24,
        },
      }),
    [],
  );

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Visit">
      <View style={styles.stack}>
        <DetailsLeadRow
          accessibilityLabel={[whenPrimary, whenSecondary].filter(Boolean).join('. ')}
          compact
          icon="calendar"
          primary={whenPrimary}
          secondary={whenSecondary}
        />
        {hasAddress ? (
          <DetailsLeadRow
            accessibilityHint={mapsInteractive ? 'Opens this address in Maps' : undefined}
            accessibilityLabel={locality ? `${street}, ${locality}` : street}
            compact
            icon="location"
            primary={street}
            secondary={locality}
            showChevron={mapsInteractive}
            onPress={mapsInteractive ? onOpenMaps : undefined}
          />
        ) : null}
        <BookingAssigneeSection
          assignedUserId={assignedUserId}
          bookingId={bookingId}
          bookingStatus={bookingStatus}
          embedded
        />
      </View>
    </DetailsSectionCard>
  );
}
