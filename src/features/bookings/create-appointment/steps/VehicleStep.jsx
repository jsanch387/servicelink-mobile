import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { DetailsSectionCard, SurfaceTextField } from '../../../../components/ui';

const FIELD_SHELL = { marginBottom: 0 };

/** US model years are typically 4 digits; strip anything that is not 0–9. */
function sanitizeVehicleYearInput(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 4);
}

export function VehicleStep({ vehicle, notes, onChangeVehicle, onChangeNotes }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 18,
        },
        fieldStack: {
          gap: 18,
        },
        notesField: {
          marginBottom: 0,
        },
      }),
    [],
  );

  return (
    <View style={styles.root}>
      <DetailsSectionCard bodyPadding="roomy" title="Vehicle">
        <View style={styles.fieldStack}>
          <SurfaceTextField
            autoCapitalize="none"
            autoCorrect={false}
            compact
            containerStyle={FIELD_SHELL}
            inputMode="numeric"
            keyboardType="number-pad"
            label="Year"
            maxLength={4}
            placeholder="2022"
            value={vehicle.year}
            onChangeText={(t) => onChangeVehicle({ ...vehicle, year: sanitizeVehicleYearInput(t) })}
          />
          <SurfaceTextField
            autoCapitalize="words"
            compact
            containerStyle={FIELD_SHELL}
            label="Make"
            placeholder="Toyota"
            value={vehicle.make}
            onChangeText={(t) => onChangeVehicle({ ...vehicle, make: t })}
          />
          <SurfaceTextField
            autoCapitalize="words"
            compact
            containerStyle={FIELD_SHELL}
            label="Model"
            placeholder="Camry"
            value={vehicle.model}
            onChangeText={(t) => onChangeVehicle({ ...vehicle, model: t })}
          />
        </View>
      </DetailsSectionCard>
      <SurfaceTextField
        compact
        containerStyle={styles.notesField}
        label="Notes"
        multiline
        numberOfLines={5}
        placeholder="Optional — notes for this booking."
        value={notes}
        style={{ minHeight: 120, paddingTop: 10, textAlignVertical: 'top' }}
        onChangeText={onChangeNotes}
      />
    </View>
  );
}
