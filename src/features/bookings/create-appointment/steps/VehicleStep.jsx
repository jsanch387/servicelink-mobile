import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { pastVehiclesMatch } from '../../../customers/utils/mapCustomerAssetToVehicle';
import { useTheme } from '../../../../theme';
import {
  BOOKING_VEHICLE_MAKE_MAX,
  BOOKING_VEHICLE_MODEL_MAX,
  sanitizeVehicleTextInput,
  sanitizeVehicleYearInput,
} from '../../../../utils/vehicle';
import { AddAnotherJobCard } from '../components/AddAnotherJobCard';
import { AppointmentNotesCard } from '../components/AppointmentNotesCard';
import { ChoiceRow } from '../components/ChoiceRow';
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
 *   pastVehicles?: Array<{ id: string; label: string; year: string; make: string; model: string }>;
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
  pastVehicles = [],
}) {
  const { colors } = useTheme();
  const hasAnyVehicleField = [vehicle.year, vehicle.make, vehicle.model].some((value) =>
    String(value ?? '').trim(),
  );
  const vehicleError =
    hasAnyVehicleField && !isVehicleStepComplete(vehicle)
      ? 'Please enter year, make, and model.'
      : null;
  const savedVehicles = Array.isArray(pastVehicles) ? pastVehicles : [];
  const hasPastVehicles = savedVehicles.length > 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        pastBlock: {
          gap: 10,
        },
        returningBanner: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
          paddingHorizontal: 2,
        },
        returningBannerText: {
          color: colors.accent,
          fontSize: 13,
          fontWeight: '600',
        },
        enterLabel: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      {hasPastVehicles ? (
        <View style={styles.pastBlock}>
          <View style={styles.returningBanner}>
            <Ionicons color={colors.accent} name="repeat-outline" size={15} />
            <AppText style={styles.returningBannerText}>Choose from their past vehicles</AppText>
          </View>
          {savedVehicles.map((past) => {
            const selected = pastVehiclesMatch(vehicle, past);
            return (
              <ChoiceRow
                key={past.id}
                selected={selected}
                title={past.label}
                onPress={() => {
                  if (selected) {
                    onChangeVehicle({ year: '', make: '', model: '' });
                    return;
                  }
                  onChangeVehicle({
                    year: past.year,
                    make: past.make,
                    model: past.model,
                  });
                }}
              />
            );
          })}
        </View>
      ) : null}

      <SurfaceCard padding="none" style={styles.card}>
        <View style={styles.fieldStack}>
          {hasPastVehicles ? (
            <AppText style={styles.enterLabel}>Or enter a different vehicle</AppText>
          ) : null}
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
