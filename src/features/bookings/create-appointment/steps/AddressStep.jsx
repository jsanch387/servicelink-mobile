import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SurfaceCard, SurfaceTextField } from '../../../../components/ui';

const FIELD_SHELL = { marginBottom: 0 };

export function AddressStep({ address, onChangeAddress }) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fieldStack: {
          gap: 18,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        rowItem: {
          flex: 1,
        },
      }),
    [],
  );

  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.fieldStack}>
        <SurfaceTextField
          compact
          containerStyle={FIELD_SHELL}
          label="Street address"
          placeholder="123 Main Street"
          value={address.street}
          onChangeText={(t) => onChangeAddress({ ...address, street: t })}
        />
        <SurfaceTextField
          compact
          containerStyle={FIELD_SHELL}
          label="Unit or apartment (optional)"
          placeholder="Apt 4B"
          value={address.unit}
          onChangeText={(t) => onChangeAddress({ ...address, unit: t })}
        />
        <SurfaceTextField
          compact
          containerStyle={FIELD_SHELL}
          label="City"
          placeholder="Austin"
          value={address.city}
          onChangeText={(t) => onChangeAddress({ ...address, city: t })}
        />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <SurfaceTextField
              autoCapitalize="characters"
              compact
              containerStyle={FIELD_SHELL}
              label="State"
              maxLength={2}
              placeholder="TX"
              value={address.state}
              onChangeText={(t) =>
                onChangeAddress({
                  ...address,
                  state: t
                    .replace(/[^a-zA-Z]/g, '')
                    .toUpperCase()
                    .slice(0, 2),
                })
              }
            />
          </View>
          <View style={styles.rowItem}>
            <SurfaceTextField
              compact
              containerStyle={FIELD_SHELL}
              keyboardType="number-pad"
              label="ZIP code"
              placeholder="78701"
              value={address.zip}
              onChangeText={(t) => onChangeAddress({ ...address, zip: t })}
            />
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}
