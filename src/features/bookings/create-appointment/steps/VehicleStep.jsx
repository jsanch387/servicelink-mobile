import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  BOOKING_VEHICLE_MAKE_MAX,
  BOOKING_VEHICLE_MODEL_MAX,
  sanitizeVehicleTextInput,
  sanitizeVehicleYearInput,
} from '../../../../utils/vehicle';
import { AddAnotherJobCard } from '../components/AddAnotherJobCard';
import { AppointmentNotesCard } from '../components/AppointmentNotesCard';
import { isVehicleStepComplete } from '../utils/createAppointmentValidators';

const FIELD_SHELL = { marginBottom: 0 };

/**
 * @param {{
 *   vehicle: { year: string; make: string; model: string };
 *   notes: string;
 *   showNotes?: boolean;
 *   onChangeVehicle: (next: { year: string; make: string; model: string }) => void;
 *   onChangeNotes: (notes: string) => void;
 *   canAddAnotherJob?: boolean;
 *   onAddAnotherJob?: () => void;
 *   addAnotherJobDisabled?: boolean;
 * }} props
 */
export function VehicleStep({
  vehicle,
  notes,
  showNotes = true,
  onChangeVehicle,
  onChangeNotes,
  canAddAnotherJob = false,
  onAddAnotherJob,
  addAnotherJobDisabled = false,
}) {
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
            keyboardType="number-pad"
            label="Year"
            maxLength={4}
            placeholder="2020"
            value={vehicle.year}
            onChangeText={(t) => onChangeVehicle({ ...vehicle, year: sanitizeVehicleYearInput(t) })}
          />
          <SurfaceTextField
            autoCapitalize="words"
            compact
            containerStyle={FIELD_SHELL}
            label="Make"
            maxLength={BOOKING_VEHICLE_MAKE_MAX}
            placeholder="Toyota"
            value={vehicle.make}
            onChangeText={(t) =>
              onChangeVehicle({
                ...vehicle,
                make: sanitizeVehicleTextInput(t, BOOKING_VEHICLE_MAKE_MAX),
              })
            }
          />
          <SurfaceTextField
            autoCapitalize="words"
            compact
            containerStyle={FIELD_SHELL}
            label="Model"
            maxLength={BOOKING_VEHICLE_MODEL_MAX}
            placeholder="Camry"
            value={vehicle.model}
            onChangeText={(t) =>
              onChangeVehicle({
                ...vehicle,
                model: sanitizeVehicleTextInput(t, BOOKING_VEHICLE_MODEL_MAX),
              })
            }
          />
          {vehicleError ? (
            <AppText style={[styles.error, { color: colors.danger }]}>{vehicleError}</AppText>
          ) : null}
        </View>
      </SurfaceCard>

      {showNotes ? <AppointmentNotesCard notes={notes} onChangeNotes={onChangeNotes} /> : null}

      {canAddAnotherJob && onAddAnotherJob ? (
        <AddAnotherJobCard disabled={addAnotherJobDisabled} onPress={onAddAnotherJob} />
      ) : null}
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
