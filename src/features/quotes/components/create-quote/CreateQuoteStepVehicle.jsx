import { useCallback, useEffect, useState } from 'react';
import { SurfaceTextField } from '../../../../components/ui';
import {
  QUOTE_VEHICLE_MAKE_MAX,
  QUOTE_VEHICLE_MODEL_MAX,
  QUOTE_VEHICLE_YEAR_MAX,
} from '../../constants/createQuoteFieldLimits';
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

/**
 * @param {object} props
 * @param {string} props.vehicleYear
 * @param {(t: string) => void} props.onVehicleYearChange
 * @param {string} props.vehicleMake
 * @param {(t: string) => void} props.onVehicleMakeChange
 * @param {string} props.vehicleModel
 * @param {(t: string) => void} props.onVehicleModelChange
 */
export function CreateQuoteStepVehicle({
  vehicleYear,
  onVehicleYearChange,
  vehicleMake,
  onVehicleMakeChange,
  vehicleModel,
  onVehicleModelChange,
}) {
  return (
    <CreateQuoteFieldStack>
      <VehicleYearField value={vehicleYear} onValueChange={onVehicleYearChange} />
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        label="Make"
        maxLength={QUOTE_VEHICLE_MAKE_MAX}
        onChangeText={onVehicleMakeChange}
        placeholder="e.g. Toyota, Sea Ray"
        value={vehicleMake}
      />
      <SurfaceTextField
        containerStyle={FIELD_SHELL}
        label="Model"
        maxLength={QUOTE_VEHICLE_MODEL_MAX}
        onChangeText={onVehicleModelChange}
        placeholder="e.g. Camry, 185 Sport"
        value={vehicleModel}
      />
    </CreateQuoteFieldStack>
  );
}
