import { useMemo } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import {
  isAddressAutocompleteAvailable,
  LocationAutocompleteField,
  ServiceAreaFields,
} from '../../../location';
import { useTheme } from '../../../../theme';
import {
  BOOKING_DEFAULT_LANGUAGE_OPTIONS,
  BOOKING_SERVICE_TYPE_MOBILE,
  BOOKING_SERVICE_TYPE_OPTIONS,
  bookingServiceTypeShowsServiceArea,
  bookingServiceTypeShowsShopAddress,
} from '../constants/bookingLinkBookingTab';
import { formatServiceCoverageLabel } from '../utils/formatBookingServiceAreaLabel';
import { parseServiceAreaCityState } from '../../utils/serviceArea';
import { BookingLinkEditCustomerPolicySection } from './BookingLinkEditCustomerPolicySection';
import { BookingLinkEditInlineSegment } from './BookingLinkEditInlineSegment';
import { BookingLinkEditMobileAreaSummary } from './BookingLinkEditMobileAreaSummary';

const FIELD_SHELL = { marginBottom: 0 };

export function BookingLinkEditBookingSection({
  styles,
  rootStyle,
  locationInput,
  selectedLocation,
  locationError,
  radiusInput,
  serviceType,
  onServiceTypeChange,
  onLocationInputChange,
  onLocationSelect,
  onRadiusChange,
  shopAddressInput,
  shopAddressMode,
  onShopAddressModeChange,
  shopStreetInput,
  shopCityInput,
  shopStateInput,
  shopZipInput,
  onShopStreetInputChange,
  onShopCityInputChange,
  onShopStateInputChange,
  onShopZipInputChange,
  selectedShopLocation,
  shopAddressError,
  onShopAddressFocus,
  onShopAddressInputChange,
  onShopAddressSelect,
  shopUnitInput,
  onShopUnitInputChange,
  spanishEnabled,
  onSpanishEnabledChange,
  defaultLanguage,
  onDefaultLanguageChange,
  policyEnabled,
  onPolicyEnabledChange,
  policyInput,
  onPolicyInputChange,
}) {
  const { colors, isDark } = useTheme();

  const showShopAddress = bookingServiceTypeShowsShopAddress(serviceType);
  const showAddressSearch = isAddressAutocompleteAvailable();
  const shopAddressIsManual = !showAddressSearch || shopAddressMode === 'manual';
  const showServiceArea = bookingServiceTypeShowsServiceArea(serviceType);
  const showMobileAreaSummary = showShopAddress && showServiceArea;

  const coverageLabel = useMemo(() => {
    const fromSelected = selectedLocation
      ? { city: selectedLocation.city, state: selectedLocation.state }
      : parseServiceAreaCityState(locationInput);
    return formatServiceCoverageLabel(fromSelected.city, fromSelected.state, radiusInput);
  }, [locationInput, radiusInput, selectedLocation]);

  const switchTrackColor = useMemo(
    () => ({ false: colors.borderStrong, true: colors.timelineCompletedFill }),
    [colors],
  );

  return (
    <View style={[styles.bookingTabSection, rootStyle]}>
      <View style={styles.bookingBlock}>
        <AppText style={styles.sectionTitle}>Where you work</AppText>

        <SurfaceCard padding="md" style={[styles.editSectionCard, styles.bookingWhereCard]}>
          <BookingLinkEditInlineSegment
            accessibilityLabel="Service type"
            options={BOOKING_SERVICE_TYPE_OPTIONS}
            selectedKey={serviceType}
            styles={styles}
            onSelect={onServiceTypeChange}
          />

          {showShopAddress ? (
            <View style={styles.bookingShopFields}>
              {shopAddressIsManual ? (
                <>
                  <SurfaceTextField
                    compact
                    containerStyle={FIELD_SHELL}
                    errorText={shopAddressError}
                    label="Street address"
                    maxLength={200}
                    placeholder="123 Main Street"
                    value={shopStreetInput}
                    onChangeText={onShopStreetInputChange}
                  />
                  <SurfaceTextField
                    compact
                    containerStyle={FIELD_SHELL}
                    label="City"
                    maxLength={100}
                    placeholder="Austin"
                    value={shopCityInput}
                    onChangeText={onShopCityInputChange}
                  />
                  <View style={styles.locationFieldsRow}>
                    <View style={styles.locationFieldState}>
                      <SurfaceTextField
                        autoCapitalize="characters"
                        compact
                        containerStyle={FIELD_SHELL}
                        label="State"
                        maxLength={2}
                        placeholder="TX"
                        value={shopStateInput}
                        onChangeText={onShopStateInputChange}
                      />
                    </View>
                    <View style={styles.locationFieldZip}>
                      <SurfaceTextField
                        compact
                        containerStyle={FIELD_SHELL}
                        keyboardType="number-pad"
                        label="ZIP code"
                        maxLength={5}
                        placeholder="78701"
                        value={shopZipInput}
                        onChangeText={onShopZipInputChange}
                      />
                    </View>
                  </View>
                </>
              ) : (
                <LocationAutocompleteField
                  errorText={shopAddressError}
                  label="Search address"
                  leftIcon={null}
                  mode="customer-address"
                  placeholder="Search street address"
                  selectedLocation={selectedShopLocation}
                  showProviderFooter={false}
                  value={shopAddressInput}
                  onChangeText={onShopAddressInputChange}
                  onFocus={onShopAddressFocus}
                  onSelect={onShopAddressSelect}
                />
              )}
              <SurfaceTextField
                containerStyle={styles.infoFieldLast}
                label="Unit (optional)"
                placeholder="Suite 4"
                value={shopUnitInput}
                onChangeText={onShopUnitInputChange}
              />
              {showAddressSearch ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onShopAddressModeChange(shopAddressIsManual ? 'search' : 'manual')}
                >
                  {({ pressed }) => (
                    <View style={pressed ? { opacity: 0.55 } : null}>
                      <AppText style={styles.bookingShopManualLink}>
                        {shopAddressIsManual ? 'Search' : 'Enter manually'}
                      </AppText>
                    </View>
                  )}
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {showMobileAreaSummary ? (
            <View style={styles.bookingMobileFieldsAfterShop}>
              <BookingLinkEditMobileAreaSummary
                coverageLabel={coverageLabel}
                errorText={locationError}
                styles={styles}
                onEdit={() => onServiceTypeChange(BOOKING_SERVICE_TYPE_MOBILE)}
              />
            </View>
          ) : null}

          {showServiceArea && !showMobileAreaSummary ? (
            <View style={styles.bookingMobileFields}>
              <ServiceAreaFields
                footer="none"
                locationError={locationError}
                locationInput={locationInput}
                locationLabel="Service area"
                radius={radiusInput}
                selectedLocation={selectedLocation}
                onLocationInputChange={onLocationInputChange}
                onLocationSelect={onLocationSelect}
                onRadiusChange={onRadiusChange}
              />
            </View>
          ) : null}
        </SurfaceCard>
      </View>

      <View style={styles.bookingBlock}>
        <AppText style={styles.sectionTitle}>Languages</AppText>

        <SurfaceCard padding={spanishEnabled ? 'md' : 'sm'} style={styles.editSectionCard}>
          <View style={styles.bookingLanguageRowSolo}>
            <AppText style={styles.bookingLanguageLabel}>Spanish</AppText>
            <Switch
              accessibilityLabel={spanishEnabled ? 'Spanish enabled' : 'Spanish disabled'}
              thumbColor={isDark ? '#f8fafc' : '#f4f4f5'}
              trackColor={switchTrackColor}
              value={spanishEnabled}
              onValueChange={onSpanishEnabledChange}
            />
          </View>

          {spanishEnabled ? (
            <View style={styles.bookingLanguageDefaultRow}>
              <AppText style={styles.bookingLanguageLabel}>Default language</AppText>
              <BookingLinkEditInlineSegment
                accessibilityLabel="Default language"
                compact
                options={BOOKING_DEFAULT_LANGUAGE_OPTIONS}
                selectedKey={defaultLanguage}
                styles={styles}
                onSelect={onDefaultLanguageChange}
              />
            </View>
          ) : null}
        </SurfaceCard>
      </View>

      <BookingLinkEditCustomerPolicySection
        policyEnabled={policyEnabled}
        policyInput={policyInput}
        styles={styles}
        onPolicyEnabledChange={onPolicyEnabledChange}
        onPolicyInputChange={onPolicyInputChange}
      />
    </View>
  );
}
