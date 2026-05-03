import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, SurfaceTextField } from '../../../../components/ui';

export function VehicleStep({ vehicle, notes, onChangeVehicle, onChangeNotes }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        dividerWrap: {
          marginBottom: 12,
          marginTop: 4,
        },
        notesField: {
          marginBottom: 0,
        },
      }),
    [],
  );

  return (
    <View>
      <SurfaceTextField
        compact
        keyboardType="number-pad"
        label="Year"
        placeholder="2022"
        value={vehicle.year}
        onChangeText={(t) => onChangeVehicle({ ...vehicle, year: t })}
      />
      <SurfaceTextField
        autoCapitalize="words"
        compact
        label="Make"
        placeholder="Toyota"
        value={vehicle.make}
        onChangeText={(t) => onChangeVehicle({ ...vehicle, make: t })}
      />
      <SurfaceTextField
        autoCapitalize="words"
        compact
        label="Model"
        placeholder="Camry"
        value={vehicle.model}
        onChangeText={(t) => onChangeVehicle({ ...vehicle, model: t })}
      />
      <View style={styles.dividerWrap}>
        <Divider />
      </View>
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
