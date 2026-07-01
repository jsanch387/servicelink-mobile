import { useMemo } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { AppText, SurfaceCard, SurfaceTextField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  BOOKING_DEFAULT_LANGUAGE_OPTIONS,
  BOOKING_SERVICE_TYPE_OPTIONS,
  bookingServiceTypeShowsServiceArea,
  bookingServiceTypeShowsShopAddress,
  getBookingServiceTypeDescription,
} from '../constants/bookingLinkBookingTab';
import { formatBookingServiceAreaLabel } from '../utils/formatBookingServiceAreaLabel';
import { BookingLinkEditInlineSegment } from './BookingLinkEditInlineSegment';

export function BookingLinkEditBookingSection({
  styles,
  rootStyle,
  cityInput,
  stateInput,
  zipInput,
  onCityInputChange,
  onStateInputChange,
  onZipInputChange,
  serviceType,
  onServiceTypeChange,
  shopStreetInput,
  onShopStreetInputChange,
  shopUnitInput,
  onShopUnitInputChange,
  spanishEnabled,
  onSpanishEnabledChange,
  defaultLanguage,
  onDefaultLanguageChange,
  onGoToDetailsTab,
}) {
  const { colors, isDark } = useTheme();

  const serviceAreaLabel = useMemo(
    () => formatBookingServiceAreaLabel(cityInput, stateInput, zipInput),
    [cityInput, stateInput, zipInput],
  );

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

        <SurfaceCard padding="md" style={styles.editSectionCard}>
          <BookingLinkEditInlineSegment
            accessibilityLabel="Service type"
            options={BOOKING_SERVICE_TYPE_OPTIONS}
            selectedKey={serviceType}
            styles={styles}
            onSelect={onServiceTypeChange}
          />

          <AppText style={styles.bookingHelperText}>
            {getBookingServiceTypeDescription(serviceType)}
          </AppText>

          {showShopAddress ? (
            <View style={styles.bookingShopFields}>
              <SurfaceTextField
                containerStyle={styles.infoField}
                label="Street address *"
                placeholder="123 Main St"
                value={shopStreetInput}
                onChangeText={onShopStreetInputChange}
              />

              <SurfaceTextField
                containerStyle={styles.infoField}
                label="Unit / suite (Optional)"
                placeholder="Suite 4"
                value={shopUnitInput}
                onChangeText={onShopUnitInputChange}
              />

              <SurfaceTextField
                containerStyle={styles.infoField}
                label="City *"
                value={cityInput}
                onChangeText={onCityInputChange}
              />

              <View style={styles.locationFieldsRow}>
                <SurfaceTextField
                  autoCapitalize="characters"
                  containerStyle={[styles.infoField, styles.locationFieldState]}
                  label="State *"
                  maxLength={2}
                  value={stateInput}
                  onChangeText={onStateInputChange}
                />

                <SurfaceTextField
                  containerStyle={[styles.infoField, styles.locationFieldZip]}
                  keyboardType="number-pad"
                  label="ZIP *"
                  maxLength={5}
                  value={zipInput}
                  onChangeText={onZipInputChange}
                />
              </View>
            </View>
          ) : null}

          {showServiceArea ? (
            <View style={styles.bookingAreaFooter}>
              <AppText style={styles.bookingAreaFooterText}>
                {`Your area: ${serviceAreaLabel ?? 'not set'} · `}
              </AppText>
              <Pressable
                accessibilityHint="Opens the Details tab to edit city, state, and ZIP"
                accessibilityLabel="Edit service area in Details"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onGoToDetailsTab}
              >
                <AppText style={styles.bookingAreaFooterLink}>edit in Details</AppText>
              </Pressable>
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
    </View>
  );
}
