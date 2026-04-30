import { View } from 'react-native';
import { SurfaceTextField } from '../../../../components/ui';

export function AddressStep({ address, onChangeAddress }) {
  return (
    <View>
      <SurfaceTextField
        compact
        label="Street address"
        placeholder="123 Main Street"
        value={address.street}
        onChangeText={(t) => onChangeAddress({ ...address, street: t })}
      />
      <SurfaceTextField
        compact
        label="Unit or apartment (optional)"
        placeholder="Apt 4B"
        value={address.unit}
        onChangeText={(t) => onChangeAddress({ ...address, unit: t })}
      />
      <SurfaceTextField
        compact
        label="City"
        placeholder="Austin"
        value={address.city}
        onChangeText={(t) => onChangeAddress({ ...address, city: t })}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <SurfaceTextField
            autoCapitalize="characters"
            compact
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
        <View style={{ flex: 1 }}>
          <SurfaceTextField
            compact
            keyboardType="number-pad"
            label="ZIP code"
            placeholder="78701"
            value={address.zip}
            onChangeText={(t) => onChangeAddress({ ...address, zip: t })}
          />
        </View>
      </View>
    </View>
  );
}
