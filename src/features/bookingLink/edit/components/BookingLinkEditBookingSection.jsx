import { useMemo } from 'react';
import { Switch, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { LocationAutocompleteField, ServiceAreaFields } from '../../../location';
import { useTheme } from '../../../../theme';
import {
  BOOKING_DEFAULT_LANGUAGE_OPTIONS,
  BOOKING_SERVICE_TYPE_OPTIONS,
  bookingServiceTypeShowsServiceArea,
  bookingServiceTypeShowsShopAddress,
} from '../constants/bookingLinkBookingTab';
import { BookingLinkEditCustomerPolicySection } from './BookingLinkEditCustomerPolicySection';
import { BookingLinkEditInlineSegment } from './BookingLinkEditInlineSegment';

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
  selectedShopLocation,
  shopAddressError,
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
  const showServiceArea = bookingServiceTypeShowsServiceArea(serviceType);

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
              <LocationAutocompleteField
                errorText={shopAddressError}
                label="Shop address"
                leftIcon="location-outline"
                mode="customer-address"
                placeholder="Search street address"
                selectedLocation={selectedShopLocation}
                showProviderFooter={false}
                value={shopAddressInput}
                onChangeText={onShopAddressInputChange}
                onSelect={onShopAddressSelect}
              />
              <SurfaceTextField
                containerStyle={styles.infoFieldLast}
                label="Unit (optional)"
                placeholder="Suite 4"
                value={shopUnitInput}
                onChangeText={onShopUnitInputChange}
              />
            </View>
          ) : null}

          {showServiceArea ? (
            <View
              style={
                showShopAddress ? styles.bookingMobileFieldsAfterShop : styles.bookingMobileFields
              }
            >
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
