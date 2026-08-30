import { View } from 'react-native';
import { AppText, SurfaceCard } from '../../../../components/ui';
import { ServiceAreaFields } from '../../../location';

export function BookingLinkEditLocationSection({
  styles,
  locationInput,
  selectedLocation,
  locationError,
  radius,
  onLocationInputChange,
  onLocationSelect,
  onRadiusChange,
}) {
  return (
    <View style={[styles.infoSection, styles.locationSection]}>
      <AppText style={styles.sectionTitle}>Location</AppText>
      <SurfaceCard padding="md" style={[styles.editSectionCard, styles.locationSectionCard]}>
        <ServiceAreaFields
          footer="none"
          locationError={locationError}
          locationInput={locationInput}
          radius={radius}
          selectedLocation={selectedLocation}
          onLocationInputChange={onLocationInputChange}
          onLocationSelect={onLocationSelect}
          onRadiusChange={onRadiusChange}
        />
      </SurfaceCard>
    </View>
  );
}
