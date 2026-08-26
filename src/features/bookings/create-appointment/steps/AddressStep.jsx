import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SegmentedToggle, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  LocationAutocompleteField,
  isAddressAutocompleteAvailable,
} from '../../../location';
import { ChoiceRow } from '../components/ChoiceRow';
import { addressFormFromStructuredLocation, createEmptyAddressForm } from '../constants';
import { CREATE_APPOINTMENT_LOCATION_OPTIONS } from '../utils/createAppointmentServiceLocation';
import { formatAppointmentAddressSecondaryLine } from '../utils/formatAppointmentAddress';

const FIELD_SHELL = { marginBottom: 0 };

const ADDRESS_MODE = {
  SEARCH: 'search',
  MANUAL: 'manual',
};

const ADDRESS_MODE_OPTIONS = [
  { key: ADDRESS_MODE.SEARCH, label: 'Search', iconName: 'search-outline', testID: 'create-appt-address-mode-search' },
  {
    key: ADDRESS_MODE.MANUAL,
    label: 'Enter manually',
    iconName: 'create-outline',
    testID: 'create-appt-address-mode-manual',
  },
];

function AddressManualFields({ address, onChangeAddress, styles }) {
  return (
    <>
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
    </>
  );
}

/**
 * @param {{
 *   address: { street: string; unit: string; city: string; state: string; zip: string };
 *   onChangeAddress: (next: { street: string; unit: string; city: string; state: string; zip: string }) => void;
 *   isReturningCustomerAddress?: boolean;
 * }} props
 */
export function AddressStep({ address, isReturningCustomerAddress = false, onChangeAddress }) {
  const { colors } = useTheme();
  const showAutocomplete = isAddressAutocompleteAvailable();
  const [mode, setMode] = useState(showAutocomplete ? ADDRESS_MODE.SEARCH : ADDRESS_MODE.MANUAL);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const streetLine = String(address.street ?? '').trim();
  const cityLine = formatAppointmentAddressSecondaryLine(address);
  const handleSearchUnavailable = useCallback(() => {
    setSearchUnavailable(true);
    setMode(ADDRESS_MODE.MANUAL);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        fieldStack: {
          gap: 18,
        },
        card: {
          overflow: 'visible',
          paddingHorizontal: 16,
          paddingVertical: 16,
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
        searchDownRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          gap: 6,
        },
        searchDownIcon: {
          alignItems: 'center',
          height: 18,
          justifyContent: 'center',
          width: 14,
        },
        searchDownTextCol: {
          flex: 1,
          minWidth: 0,
        },
        searchDownText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        pickedCard: {
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderColor: 'rgba(10,10,10,0.08)',
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          paddingHorizontal: 12,
          paddingVertical: 12,
        },
        pickedIcon: {
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          borderRadius: 12,
          height: 36,
          justifyContent: 'center',
          marginRight: 12,
          width: 36,
        },
        pickedTextCol: {
          flex: 1,
          minWidth: 0,
        },
        pickedStreet: {
          color: '#0a0a0a',
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.25,
        },
        pickedCity: {
          color: '#525252',
          fontSize: 13,
          fontWeight: '500',
          marginTop: 2,
        },
        pickedClear: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          width: 32,
        },
      }),
    [colors],
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
        {showAutocomplete ? (
          <SegmentedToggle
            appearance="lifted"
            options={ADDRESS_MODE_OPTIONS}
            selected={mode}
            onSelect={setMode}
          />
        ) : null}
        {searchUnavailable ? (
          <View style={styles.searchDownRow}>
            <View style={styles.searchDownIcon}>
              <Ionicons color={colors.textMuted} name="information-circle-outline" size={14} />
            </View>
            <View style={styles.searchDownTextCol}>
              <AppText style={styles.searchDownText}>
                Address search is down. Enter it manually.
              </AppText>
            </View>
          </View>
        ) : null}
        {showAutocomplete && mode === ADDRESS_MODE.SEARCH ? (
          <>
            <LocationAutocompleteField
              containerStyle={FIELD_SHELL}
              label="Search address"
              mode="customer-address"
              placeholder="Start typing a street address"
              selectedLocation={selectedLocation}
              showProviderFooter={false}
              value={searchQuery}
              onChangeText={(next) => {
                setSelectedLocation(null);
                setSearchQuery(next);
              }}
              onFocus={() => {
                setSelectedLocation(null);
                setSearchQuery('');
              }}
              onProviderUnavailable={handleSearchUnavailable}
              onSelect={(location) => {
                setSearchUnavailable(false);
                setSelectedLocation(location);
                setSearchQuery('');
                onChangeAddress(addressFormFromStructuredLocation(location, address));
              }}
            />
            <SurfaceTextField
              compact
              containerStyle={FIELD_SHELL}
              label="Unit or apartment (optional)"
              maxLength={50}
              placeholder="Apt 4B"
              testID="create-appt-address-unit-search"
              value={address.unit}
              onChangeText={(t) => onChangeAddress({ ...address, unit: t })}
            />
            {streetLine ? (
              <View style={styles.pickedCard}>
                <View style={styles.pickedIcon}>
                  <Ionicons color="#0a0a0a" name="location" size={18} />
                </View>
                <View style={styles.pickedTextCol}>
                  <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.pickedStreet}>
                    {streetLine}
                  </AppText>
                  {cityLine ? (
                    <AppText ellipsizeMode="tail" numberOfLines={1} style={styles.pickedCity}>
                      {cityLine}
                    </AppText>
                  ) : null}
                </View>
                <Pressable
                  accessibilityLabel="Clear selected address"
                  accessibilityRole="button"
                  testID="create-appt-address-clear"
                  onPress={() => {
                    setSelectedLocation(null);
                    setSearchQuery('');
                    onChangeAddress({ ...createEmptyAddressForm(), unit: address.unit });
                  }}
                >
                  {({ pressed }) => (
                    <View style={[styles.pickedClear, pressed && { opacity: 0.55 }]}>
                      <Ionicons color="#737373" name="close-circle" size={22} />
                    </View>
                  )}
                </Pressable>
              </View>
            ) : null}
          </>
        ) : (
          <AddressManualFields address={address} styles={styles} onChangeAddress={onChangeAddress} />
        )}
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
