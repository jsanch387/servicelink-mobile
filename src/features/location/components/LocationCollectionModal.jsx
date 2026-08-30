import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { buildServiceAreaPayload } from '../api/locationApi';
import { DEFAULT_SERVICE_AREA_RADIUS } from '../constants/serviceAreaRadius';
import { SERVICE_AREA_PROMPT_DISMISSIBLE } from '../constants/serviceAreaPrompt';
import { formatLocationDisplay } from '../services/locationAutocomplete';
import { LocationSuggestionOverlayProvider } from './LocationSuggestionOverlay';
import { ServiceAreaFields } from './ServiceAreaFields';

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
  const { colors } = useTheme();
  const [locationInput, setLocationInput] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [radius, setRadius] = useState(DEFAULT_SERVICE_AREA_RADIUS);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) return;
    setLocationInput('');
    setSelectedLocation(null);
    setLocationError('');
    setSubmitError('');
    setRadius(DEFAULT_SERVICE_AREA_RADIUS);
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

  return (
    <BottomSheetModal
      allowBackdropClose={false}
      footer={
        <View style={styles.footer}>
          {submitError ? (
            <AppText style={[styles.submitError, { color: colors.danger }]}>{submitError}</AppText>
          ) : null}
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
      <LocationSuggestionOverlayProvider>
        <ServiceAreaFields
          locationError={locationError}
          locationInput={locationInput}
          radius={radius}
          selectedLocation={selectedLocation}
          onLocationInputChange={(next) => {
            setLocationInput(next);
            setSelectedLocation(null);
            setLocationError('');
            setSubmitError('');
          }}
          onLocationSelect={(location) => {
            setSelectedLocation(location);
            setLocationInput(formatLocationDisplay(location));
            setLocationError('');
            setSubmitError('');
          }}
          onRadiusChange={setRadius}
        />
      </LocationSuggestionOverlayProvider>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  submitError: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  footer: {
    gap: 10,
    marginTop: 8,
  },
});
