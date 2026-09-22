import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { PastAssetsPickerSheet } from '../components/PastAssetsPickerSheet';
import { PAST_ASSETS_CHANGE, PAST_ASSETS_CTA, PAST_ASSETS_SHEET_TITLE } from '../constants';
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
  const [pastOpen, setPastOpen] = useState(false);
  const hasAnyVehicleField = [vehicle.year, vehicle.make, vehicle.model].some((value) =>
    String(value ?? '').trim(),
  );
  const vehicleError =
    hasAnyVehicleField && !isVehicleStepComplete(vehicle)
      ? 'Please enter year, make, and model.'
      : null;
  const savedVehicles = Array.isArray(pastVehicles) ? pastVehicles : [];
  const hasPastVehicles = savedVehicles.length > 0;
  const selectedPast = savedVehicles.find((past) => pastVehiclesMatch(vehicle, past)) ?? null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          gap: 18,
        },
        vehicleBlock: {
          gap: 10,
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
        ctaCard: {
          paddingHorizontal: 14,
          paddingVertical: 12,
        },
        ctaPressed: {
          opacity: 0.72,
        },
        ctaRow: {
          alignItems: 'center',
          flexDirection: 'row',
          width: '100%',
        },
        ctaIconWell: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
        ctaLabelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingHorizontal: 12,
        },
        ctaLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.2,
        },
        ctaValueCol: {
          alignItems: 'flex-end',
          justifyContent: 'center',
          paddingRight: 4,
        },
        ctaValue: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
        ctaChevronCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.vehicleBlock}>
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
              onChangeText={(t) =>
                onChangeVehicle({ ...vehicle, year: sanitizeVehicleYearInput(t) })
              }
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

        {hasPastVehicles ? (
          <Pressable
            accessibilityHint="Opens past vehicles for this customer"
            accessibilityLabel={selectedPast?.label ? selectedPast.label : PAST_ASSETS_CTA}
            accessibilityRole="button"
            onPress={() => setPastOpen(true)}
          >
            {({ pressed }) => (
              <SurfaceCard padding="none" style={[styles.ctaCard, pressed && styles.ctaPressed]}>
                <View style={styles.ctaRow}>
                  <View style={styles.ctaIconWell}>
                    <Ionicons color={colors.textSecondary} name="car-outline" size={16} />
                  </View>
                  <View style={styles.ctaLabelCol}>
                    <AppText numberOfLines={1} style={styles.ctaLabel}>
                      {selectedPast?.label || PAST_ASSETS_CTA}
                    </AppText>
                  </View>
                  {selectedPast ? (
                    <View style={styles.ctaValueCol}>
                      <AppText style={styles.ctaValue}>{PAST_ASSETS_CHANGE}</AppText>
                    </View>
                  ) : null}
                  <View style={styles.ctaChevronCol}>
                    <Ionicons color={colors.textMuted} name="chevron-forward" size={16} />
                  </View>
                </View>
              </SurfaceCard>
            )}
          </Pressable>
        ) : null}
      </View>

      {showNotes ? <AppointmentNotesCard notes={notes} onChangeNotes={onChangeNotes} /> : null}

      {canAddAnotherJob && onAddAnotherJob ? (
        <AddAnotherJobCard disabled={addAnotherJobDisabled} onPress={onAddAnotherJob} />
      ) : null}

      <PastAssetsPickerSheet
        items={savedVehicles}
        selectedId={selectedPast?.id ?? null}
        title={PAST_ASSETS_SHEET_TITLE}
        visible={pastOpen}
        onRequestClose={() => setPastOpen(false)}
        onSelect={(item) => {
          const past = savedVehicles.find((row) => row.id === item.id);
          if (!past) {
            setPastOpen(false);
            return;
          }
          if (selectedPast?.id === past.id) {
            onChangeVehicle({ year: '', make: '', model: '' });
          } else {
            onChangeVehicle({
              year: past.year,
              make: past.make,
              model: past.model,
            });
          }
          setPastOpen(false);
        }}
      />
    </View>
  );
}
