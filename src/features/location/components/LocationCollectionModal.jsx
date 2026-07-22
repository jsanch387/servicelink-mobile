import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button, SelectField } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { buildServiceAreaPayload } from '../api/locationApi';
import { SERVICE_AREA_PROMPT_DISMISSIBLE } from '../constants/serviceAreaPrompt';
import { formatLocationDisplay } from '../services/locationAutocomplete';
import { LocationAutocompleteField } from './LocationAutocompleteField';

const RADIUS_OPTIONS = [
  { label: '5 miles', value: '5' },
  { label: '10 miles', value: '10' },
  { label: '15 miles', value: '15' },
  { label: '20 miles', value: '20' },
  { label: '25 miles', value: '25' },
  { label: '30 miles', value: '30' },
  { label: '40 miles', value: '40' },
  { label: '50 miles', value: '50' },
  { label: '75 miles', value: '75' },
  { label: '100 miles', value: '100' },
];

const DEFAULT_RADIUS = '25';

/**
 * Service-area collection sheet — matches web “Where do you serve?” contract.
 *
 * @param {{
 *   visible?: boolean;
 *   onDismiss: () => void;
 *   onSave: (payload: {
 *     label: string;
 *     city: string;
 *     stateCode: string;
 *     postalCode?: string | null;
 *     latitude: number;
 *     longitude: number;
 *     radiusMiles: number;
 *     placeType?: string | null;
 *     providerPlaceId?: string | null;
 *   }) => Promise<void>;
 * }} props
 */
export function LocationCollectionModal({ visible = false, onDismiss, onSave }) {
  const { colors, isDark } = useTheme();
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) return;
    setLocationInput('');
    setSelectedLocation(null);
    setLocationError('');
    setSubmitError('');
    setRadius(DEFAULT_RADIUS);
    setIsSaving(false);
  }, [visible]);

  const canSave = Boolean(selectedLocation && radius);

  const handleSave = async () => {
    if (!selectedLocation) {
      setLocationError('Choose a suggested location to confirm it');
      return;
    }
    if (!canSave || isSaving) return;

    setIsSaving(true);
    setSubmitError('');
    try {
      const payload = buildServiceAreaPayload(selectedLocation, parseInt(radius, 10));
      await onSave?.(payload);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save service area.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (!SERVICE_AREA_PROMPT_DISMISSIBLE) return;
    onDismiss?.();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        locationSection: {
          marginBottom: 20,
          overflow: 'visible',
          zIndex: 20,
        },
        radiusSection: {
          marginBottom: 12,
          zIndex: 1,
        },
        helperText: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginBottom: 16,
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
        submitError: {
          color: colors.danger,
          fontSize: 13,
          fontWeight: '500',
          marginBottom: 4,
        },
        footer: {
          gap: 10,
          marginTop: 8,
        },
      }),
    [colors, isDark],
  );

  return (
    <BottomSheetModal
      allowBackdropClose={false}
      footer={
        <View style={styles.footer}>
          {submitError ? <AppText style={styles.submitError}>{submitError}</AppText> : null}
          <Button
            disabled={!canSave || isSaving}
            fullWidth
            loading={isSaving}
            title="Confirm service area"
            variant="primary"
            onPress={() => {
              void handleSave();
            }}
          />
          {SERVICE_AREA_PROMPT_DISMISSIBLE ? (
            <Button
              disabled={isSaving}
              fullWidth
              title="I'll add it later"
              variant="secondary"
              onPress={handleSkip}
            />
          ) : null}
        </View>
      }
      showCloseButton={SERVICE_AREA_PROMPT_DISMISSIBLE}
      sheetHeightPercent={92}
      stickyFooter
      liftFooterWithKeyboard={false}
      subtitle="Set your base and travel distance."
      title="Where do you serve?"
      visible={visible}
      onRequestClose={isSaving || !SERVICE_AREA_PROMPT_DISMISSIBLE ? () => {} : handleSkip}
    >
      <View style={styles.locationSection}>
        <LocationAutocompleteField
          errorText={locationError}
          label="Base location"
          placeholder="Search city, state, or ZIP"
          selectedLocation={selectedLocation}
          value={locationInput}
          onChangeText={(next) => {
            setLocationInput(next);
            setSelectedLocation(null);
            setLocationError('');
            setSubmitError('');
          }}
          onSelect={(location) => {
            setSelectedLocation(location);
            setLocationInput(formatLocationDisplay(location));
            setLocationError('');
            setSubmitError('');
          }}
        />
      </View>

      <View style={styles.radiusSection}>
        <SelectField
          fieldStyle={{ marginTop: 0 }}
          label="Travel distance"
          options={RADIUS_OPTIONS}
          presentation="wheel"
          value={radius}
          onValueChange={setRadius}
        />
      </View>

      <AppText style={styles.helperText}>
        This helps nearby customers find you and book with you.
      </AppText>

      {selectedLocation ? (
        <View style={styles.reachCard}>
          <AppText style={styles.reachLabel}>Your customer reach</AppText>
          <AppText style={styles.reachText}>
            Customers within {radius} miles of {selectedLocation.city}, {selectedLocation.state} can
            find your business.
          </AppText>
        </View>
      ) : null}
    </BottomSheetModal>
  );
}
