import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import { ChoiceRow } from '../components/ChoiceRow';
import { CREATE_APPOINTMENT_LOCATION_OPTIONS } from '../utils/createAppointmentServiceLocation';

const FIELD_SHELL = { marginBottom: 0 };

/**
 * @param {{
 *   address: { street: string; unit: string; city: string; state: string; zip: string };
 *   onChangeAddress: (next: { street: string; unit: string; city: string; state: string; zip: string }) => void;
 *   isReturningCustomerAddress?: boolean;
 * }} props
 */
export function AddressStep({ address, isReturningCustomerAddress = false, onChangeAddress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        fieldStack: {
          gap: 18,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 16,
          overflow: 'visible',
          zIndex: 1,
        },
        row: {
          flexDirection: 'row',
          gap: 12,
        },
        rowItem: {
          flex: 1,
        },
        returningBanner: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        },
        returningBannerText: {
          color: colors.accent,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors.accent],
  );

  return (
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.fieldStack}>
        {isReturningCustomerAddress ? (
          <View style={styles.returningBanner}>
            <Ionicons color={colors.accent} name="repeat-outline" size={15} />
            <AppText style={styles.returningBannerText}>
              Pre-filled from their last appointment
            </AppText>
          </View>
        ) : null}
        <SurfaceTextField
          compact
          containerStyle={FIELD_SHELL}
          label="Street address"
          maxLength={200}
          placeholder="123 Main Street"
          testID="create-appt-address-street"
          value={address.street}
          onChangeText={(t) => onChangeAddress({ ...address, street: t })}
        />
        <SurfaceTextField
          compact
          containerStyle={FIELD_SHELL}
          label="Unit or apartment (optional)"
          maxLength={50}
          placeholder="Apt 4B"
          testID="create-appt-address-unit"
          value={address.unit}
          onChangeText={(t) => onChangeAddress({ ...address, unit: t })}
        />
        <SurfaceTextField
          compact
          containerStyle={FIELD_SHELL}
          label="City"
          maxLength={100}
          placeholder="Austin"
          testID="create-appt-address-city"
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
              testID="create-appt-address-state"
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
              maxLength={5}
              placeholder="78701"
              testID="create-appt-address-zip"
              value={address.zip}
              onChangeText={(t) =>
                onChangeAddress({
                  ...address,
                  zip: String(t ?? '')
                    .replace(/\D/g, '')
                    .slice(0, 5),
                })
              }
            />
          </View>
        </View>
      </View>
    </SurfaceCard>
  );
}

export function LocationStep({
  appointmentLocationType,
  onSelectLocationType,
  shopAddressMissing,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        shopMissing: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginBottom: 12,
        },
      }),
    [colors],
  );

  return (
    <View>
      {shopAddressMissing ? (
        <AppText style={styles.shopMissing}>
          Add your shop address in Booking Link → Edit profile → Booking before scheduling shop
          appointments.
        </AppText>
      ) : null}
      {CREATE_APPOINTMENT_LOCATION_OPTIONS.map((option) => (
        <ChoiceRow
          key={option.key}
          selected={appointmentLocationType === option.key}
          subtitle={option.subtitle}
          title={option.title}
          onPress={() => onSelectLocationType(option.key)}
        />
      ))}
    </View>
  );
}
