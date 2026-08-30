import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SelectField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { SERVICE_AREA_RADIUS_OPTIONS } from '../constants/serviceAreaRadius';
import { formatLocationDisplay } from '../services/locationAutocomplete';
import { LocationAutocompleteField } from './LocationAutocompleteField';

/**
 * Shared MapTiler base + travel-distance fields (login modal and booking-link edit).
 *
 * @param {{
 *   locationInput: string;
 *   selectedLocation?: import('../types/location').StructuredLocation | null;
 *   locationError?: string;
 *   radius: string;
 *   footer?: 'reach' | 'summary' | 'none';
 *   locationLabel?: string;
 *   onLocationInputChange: (value: string) => void;
 *   onLocationSelect: (location: import('../types/location').StructuredLocation) => void;
 *   onRadiusChange: (value: string) => void;
 * }} props
 */
export function ServiceAreaFields({
  locationInput,
  selectedLocation = null,
  locationError = '',
  radius,
  footer = 'reach',
  locationLabel = 'Base location',
  onLocationInputChange,
  onLocationSelect,
  onRadiusChange,
}) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: 14,
        },
        locationSection: {
          overflow: 'visible',
          zIndex: 20,
        },
        radiusSection: {
          zIndex: 1,
        },
        helperText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 2,
        },
        reachCard: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: 1,
          marginBottom: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        reachLabel: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
        reachText: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '600',
          lineHeight: 20,
        },
        summaryCard: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
          borderRadius: 14,
          flexDirection: 'row',
          marginTop: 4,
          paddingHorizontal: 14,
          paddingVertical: 12,
          width: '100%',
        },
        summaryIcon: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          borderRadius: 16,
          height: 32,
          justifyContent: 'center',
          marginRight: 12,
          width: 32,
        },
        summaryTextCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        summaryLocation: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: -0.15,
        },
        summaryRadius: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 2,
        },
      }),
    [colors, isDark],
  );

  const summaryLocation =
    selectedLocation != null
      ? formatLocationDisplay(selectedLocation)
      : String(locationInput ?? '').trim();

  return (
    <View style={styles.stack}>
      <View style={styles.locationSection}>
        <LocationAutocompleteField
          errorText={locationError}
          label={locationLabel}
          placeholder="Search city, state, or ZIP"
          selectedLocation={selectedLocation}
          value={locationInput}
          onChangeText={onLocationInputChange}
          onSelect={(location) => {
            onLocationSelect(location);
          }}
        />
      </View>

      <View style={styles.radiusSection}>
        <SelectField
          fieldStyle={{ marginTop: 0 }}
          label="Travel distance"
          options={SERVICE_AREA_RADIUS_OPTIONS}
          presentation="wheel"
          value={radius}
          onValueChange={onRadiusChange}
        />
      </View>

      {footer === 'summary' && summaryLocation ? (
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons color={colors.textMuted} name="location-outline" size={16} />
          </View>
          <View style={styles.summaryTextCol}>
            <AppText numberOfLines={1} style={styles.summaryLocation}>
              {summaryLocation}
            </AppText>
            <AppText style={styles.summaryRadius}>{radius} miles</AppText>
          </View>
        </View>
      ) : null}

      {footer === 'reach' ? (
        <AppText style={styles.helperText}>
          This helps nearby customers find you and book with you.
        </AppText>
      ) : null}

      {footer === 'reach' && selectedLocation ? (
        <View style={styles.reachCard}>
          <AppText style={styles.reachLabel}>Your customer reach</AppText>
          <AppText style={styles.reachText}>
            Customers within {radius} miles of {selectedLocation.city}, {selectedLocation.state} can
            find your business.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}
