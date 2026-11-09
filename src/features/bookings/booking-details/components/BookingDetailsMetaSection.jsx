import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, ValueNavRow } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

function ReadOnlyNote({ note }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        block: {
          paddingHorizontal: 16,
          paddingVertical: 13,
          width: '100%',
        },
        label: {
          color: colors.text,
          fontSize: 16,
          letterSpacing: -0.2,
        },
        body: {
          color: colors.textMuted,
          fontSize: 15,
          letterSpacing: -0.1,
          marginTop: 4,
        },
        dividerRow: {
          flexDirection: 'row',
          paddingHorizontal: 16,
        },
        hairline: {
          backgroundColor: colors.border,
          flex: 1,
          height: StyleSheet.hairlineWidth,
          opacity: 0.55,
        },
      }),
    [colors],
  );

  return (
    <View accessibilityLabel={`Notes, ${note}`}>
      <View style={styles.block}>
        <AppText style={styles.label}>Notes</AppText>
        <AppText style={styles.body}>{note}</AppText>
      </View>
      <View style={styles.dividerRow}>
        <View style={styles.hairline} />
      </View>
    </View>
  );
}

/**
 * Assigned to, vehicle, notes, and texts — one grouped list.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.assignee]
 * @param {string} [props.vehicle]
 * @param {string} [props.notes]
 * @param {() => void} [props.onNotesPress]
 * @param {() => void} props.onActivityPress
 */
export function BookingDetailsMetaSection({
  assignee = null,
  vehicle = '',
  notes = '',
  onNotesPress,
  onActivityPress,
}) {
  const vehicleLabel = String(vehicle ?? '').trim();
  const notesLabel = String(notes ?? '').trim();
  const showNotes = Boolean(notesLabel) || typeof onNotesPress === 'function';

  return (
    <DetailsSectionCard flush title="Details">
      {assignee}
      {vehicleLabel ? <ValueNavRow label="Vehicle" showDividerBelow value={vehicleLabel} /> : null}
      {showNotes && onNotesPress ? (
        <ValueNavRow
          accessibilityHint={notesLabel ? 'View notes for this visit' : 'Add notes for this visit'}
          accessibilityLabel="Notes"
          label="Notes"
          showDividerBelow
          value={notesLabel}
          onPress={onNotesPress}
        />
      ) : null}
      {showNotes && !onNotesPress && notesLabel ? <ReadOnlyNote note={notesLabel} /> : null}
      <ValueNavRow
        accessibilityHint="See texts and emails we sent your customer"
        accessibilityLabel="Texts and emails"
        label="Texts and emails"
        showDividerBelow={false}
        onPress={onActivityPress}
      />
    </DetailsSectionCard>
  );
}
