import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { AppointmentNotesCard } from '../components/AppointmentNotesCard';
import { isVehicleStepComplete } from '../utils/createAppointmentValidators';

const FIELD_SHELL = { marginBottom: 0 };

/** US model years are typically 4 digits; strip anything that is not 0–9. */
function sanitizeVehicleYearInput(raw) {
  return String(raw ?? '')
    .replace(/\D/g, '')
    .slice(0, 4);
}

export function VehicleStep({ vehicle, notes, showNotes = true, onChangeVehicle, onChangeNotes }) {
  const { colors } = useTheme();
  const hasAnyVehicleField = [vehicle.year, vehicle.make, vehicle.model].some((value) =>
    String(value ?? '').trim(),
  );
  const vehicleError =
    hasAnyVehicleField && !isVehicleStepComplete(vehicle)
      ? 'Please enter year, make, and model.'
      : null;

  return (
    <View style={styles.root}>
      <SurfaceCard padding="none" style={styles.card}>
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
          {vehicleError ? (
            <AppText style={[styles.error, { color: colors.danger }]}>{vehicleError}</AppText>
          ) : null}
        </View>
      </SurfaceCard>

      {showNotes ? <AppointmentNotesCard notes={notes} onChangeNotes={onChangeNotes} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 18,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  fieldStack: {
    gap: 18,
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
});
