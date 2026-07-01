import { View } from 'react-native';
import { AppText, SelectField, SurfaceCard, SurfaceTextField } from '../../../../components/ui';

export function BookingLinkEditBusinessInfoSection({
  styles,
  rootStyle,
  nameInput,
  onNameInputChange,
  businessTypeOptions,
  typeInput,
  onTypeInputChange,
  cityInput,
  onCityInputChange,
  stateInput,
  onStateInputChange,
  zipInput,
  onZipInputChange,
  bioInput,
  onBioInputChange,
}) {
  return (
    <View style={[styles.infoSection, rootStyle]}>
      <AppText style={styles.sectionTitle}>Business Information</AppText>
      <SurfaceCard style={styles.editSectionCard} padding="md">
        <SurfaceTextField
          containerStyle={styles.infoField}
          label="Business Name *"
          value={nameInput}
          onChangeText={onNameInputChange}
        />

        <View style={styles.infoField}>
          <SelectField
            fieldStyle={styles.infoSelectFieldFlushTop}
            label="Business Type *"
            options={businessTypeOptions}
            presentation="wheel"
            value={typeInput}
            onValueChange={onTypeInputChange}
          />
        </View>

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
      </SurfaceCard>

      <View style={styles.bioSection}>
        <AppText style={styles.sectionTitle}>Business Bio (Optional)</AppText>
        <SurfaceTextField
          containerStyle={styles.bioFieldWrap}
          multiline
          style={styles.bioInput}
          textAlignVertical="top"
          value={bioInput}
          onChangeText={onBioInputChange}
        />
      </View>
    </View>
  );
}
