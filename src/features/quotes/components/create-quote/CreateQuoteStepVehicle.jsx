import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceTextField } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { isOptionalVehicleComplete } from '../../../../utils/vehicle';
import {
  QUOTE_VEHICLE_MAKE_MAX,
  QUOTE_VEHICLE_MODEL_MAX,
  QUOTE_VEHICLE_YEAR_MAX,
} from '../../constants/createQuoteFieldLimits';
import { CREATE_QUOTE_SECOND_VEHICLE_ENABLED } from '../../constants/createQuoteWizard';
import { formatQuoteVehicleLine } from '../../utils/quoteVehicles';
import { CreateQuoteFieldStack } from './CreateQuoteFieldStack';

const FIELD_SHELL = { marginBottom: 0 };

/**
 * Year field: digits-only, local value updates in the same frame so non-numeric keys
 * don’t flash before the parent re-renders.
 */
function VehicleYearField({ value, onValueChange }) {
  const [localYear, setLocalYear] = useState(() =>
    String(value ?? '')
      .replace(/\D/g, '')
      .slice(0, QUOTE_VEHICLE_YEAR_MAX),
  );

  useEffect(() => {
    setLocalYear(
      String(value ?? '')
        .replace(/\D/g, '')
        .slice(0, QUOTE_VEHICLE_YEAR_MAX),
    );
  }, [value]);

  const onChangeText = useCallback(
    (t) => {
      const cleaned = String(t ?? '')
        .replace(/\D/g, '')
        .slice(0, QUOTE_VEHICLE_YEAR_MAX);
      setLocalYear(cleaned);
      onValueChange(cleaned);
    },
    [onValueChange],
  );

  return (
    <SurfaceTextField
      autoCorrect={false}
      containerStyle={FIELD_SHELL}
      keyboardType="number-pad"
      label="Year"
      maxLength={QUOTE_VEHICLE_YEAR_MAX}
      onChangeText={onChangeText}
      placeholder="2020"
      value={localYear}
    />
  );
}

function VehicleFields({ year, make, model, onYearChange, onMakeChange, onModelChange, error }) {
  const { colors } = useTheme();

  return (
    <CreateQuoteFieldStack>
      <VehicleYearField value={year} onValueChange={onYearChange} />
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        label="Make"
        maxLength={QUOTE_VEHICLE_MAKE_MAX}
        onChangeText={onMakeChange}
        placeholder="e.g. Toyota, Sea Ray"
        value={make}
      />
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        label="Model"
        maxLength={QUOTE_VEHICLE_MODEL_MAX}
        onChangeText={onModelChange}
        placeholder="e.g. Camry, 185 Sport"
        value={model}
      />
      {error ? <AppText style={[styles.error, { color: colors.danger }]}>{error}</AppText> : null}
    </CreateQuoteFieldStack>
  );
}

function vehicleGroupError(year, make, model) {
  const hasAny = [year, make, model].some((value) => Boolean(String(value ?? '').trim()));
  if (
    hasAny &&
    !isOptionalVehicleComplete({
      year,
      make,
      model,
    })
  ) {
    return 'Please enter a valid year, make, and model.';
  }
  return null;
}

function CommittedVehicleCard({ line, onRemove }) {
  const { colors, isDark } = useTheme();
  const label = String(line ?? '').trim() || 'Vehicle';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderRadius: 14,
          flexDirection: 'row',
          width: '100%',
        },
        iconCol: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingLeft: 14,
          width: 42,
        },
        labelCol: {
          flex: 1,
          minWidth: 0,
          paddingVertical: 14,
          paddingRight: 8,
        },
        line: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          letterSpacing: -0.2,
        },
        trashCol: {
          alignItems: 'center',
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.row}>
      <View style={styles.iconCol}>
        <Ionicons color={colors.accentMuted} name="car-sport" size={20} />
      </View>
      <View style={styles.labelCol}>
        <AppText numberOfLines={2} style={styles.line}>
          {label}
        </AppText>
      </View>
      {typeof onRemove === 'function' ? (
        <Pressable
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          hitSlop={6}
          onPress={onRemove}
        >
          {({ pressed }) => (
            <View style={[styles.trashCol, pressed ? { opacity: 0.7 } : null]}>
              <Ionicons color={colors.danger} name="trash-outline" size={18} />
            </View>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * @param {object} props
 * @param {string} props.vehicleYear
 * @param {(t: string) => void} props.onVehicleYearChange
 * @param {string} props.vehicleMake
 * @param {(t: string) => void} props.onVehicleMakeChange
 * @param {string} props.vehicleModel
 * @param {(t: string) => void} props.onVehicleModelChange
 * @param {boolean} [props.showSecondVehicle]
 * @param {() => void} [props.onAddSecondVehicle]
 * @param {() => void} [props.onRemoveCommittedVehicle]
 * @param {string} [props.vehicle2Year]
 * @param {(t: string) => void} [props.onVehicle2YearChange]
 * @param {string} [props.vehicle2Make]
 * @param {(t: string) => void} [props.onVehicle2MakeChange]
 * @param {string} [props.vehicle2Model]
 * @param {(t: string) => void} [props.onVehicle2ModelChange]
 */
export function CreateQuoteStepVehicle({
  vehicleYear,
  onVehicleYearChange,
  vehicleMake,
  onVehicleMakeChange,
  vehicleModel,
  onVehicleModelChange,
  showSecondVehicle = false,
  onAddSecondVehicle,
  onRemoveCommittedVehicle,
  vehicle2Year = '',
  onVehicle2YearChange,
  vehicle2Make = '',
  onVehicle2MakeChange,
  vehicle2Model = '',
  onVehicle2ModelChange,
}) {
  const { colors } = useTheme();
  const firstComplete = isOptionalVehicleComplete({
    year: vehicleYear,
    make: vehicleMake,
    model: vehicleModel,
  });
  const firstFilled = [vehicleYear, vehicleMake, vehicleModel].some((value) =>
    Boolean(String(value ?? '').trim()),
  );
  const secondVehicleOpen = CREATE_QUOTE_SECOND_VEHICLE_ENABLED && showSecondVehicle;
  const canAddSecond =
    CREATE_QUOTE_SECOND_VEHICLE_ENABLED &&
    !showSecondVehicle &&
    firstFilled &&
    firstComplete &&
    typeof onAddSecondVehicle === 'function';
  const committedLine = formatQuoteVehicleLine({
    year: vehicleYear,
    make: vehicleMake,
    model: vehicleModel,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 18,
        },
        addFace: {
          alignItems: 'center',
          borderColor: colors.border,
          borderRadius: 14,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          flexDirection: 'row',
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 14,
          width: '100%',
        },
        addLabelCol: {
          flexShrink: 1,
        },
        addIconCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
        },
        addLabel: {
          color: colors.accent,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.stack}>
      {secondVehicleOpen ? (
        <CommittedVehicleCard line={committedLine} onRemove={onRemoveCommittedVehicle} />
      ) : (
        <VehicleFields
          error={vehicleGroupError(vehicleYear, vehicleMake, vehicleModel)}
          make={vehicleMake}
          model={vehicleModel}
          year={vehicleYear}
          onMakeChange={onVehicleMakeChange}
          onModelChange={onVehicleModelChange}
          onYearChange={onVehicleYearChange}
        />
      )}

      {/* Second vehicle — revisit when CREATE_QUOTE_SECOND_VEHICLE_ENABLED is true. */}
      {secondVehicleOpen ? (
        <VehicleFields
          error={vehicleGroupError(vehicle2Year, vehicle2Make, vehicle2Model)}
          make={vehicle2Make}
          model={vehicle2Model}
          year={vehicle2Year}
          onMakeChange={onVehicle2MakeChange}
          onModelChange={onVehicle2ModelChange}
          onYearChange={onVehicle2YearChange}
        />
      ) : null}

      {canAddSecond ? (
        <Pressable
          accessibilityHint="Saves this vehicle and adds another year, make, and model"
          accessibilityLabel="Add another vehicle"
          accessibilityRole="button"
          onPress={onAddSecondVehicle}
        >
          {({ pressed }) => (
            <View style={[styles.addFace, pressed ? { opacity: 0.88 } : null]}>
              <View style={styles.addIconCol}>
                <Ionicons color={colors.accent} name="add" size={20} />
              </View>
              <View style={styles.addLabelCol}>
                <AppText style={styles.addLabel}>Add another vehicle</AppText>
              </View>
            </View>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
});
