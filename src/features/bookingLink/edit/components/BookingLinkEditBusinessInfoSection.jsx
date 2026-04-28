import { View } from 'react-native';
import { AppText, SelectField, SurfaceTextField } from '../../../../components/ui';

export function BookingLinkEditBusinessInfoSection({
  styles,
  nameInput,
  onNameInputChange,
  businessTypeOptions,
  typeInput,
  onTypeInputChange,
  cityInput,
  onCityInputChange,
  stateInput,
  onStateInputChange,
  bioInput,
  onBioInputChange,
}) {
  return (
    <View style={styles.infoSection}>
      <AppText style={styles.sectionTitle}>Business Information</AppText>
      <AppText style={[styles.sectionBody, styles.infoSectionIntro]}>
        Tell customers about your business and what makes you unique.
      </AppText>

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
        label="City (Optional)"
        value={cityInput}
        onChangeText={onCityInputChange}
      />

      <SurfaceTextField
        containerStyle={styles.infoField}
        label="State (Optional)"
        autoCapitalize="characters"
        maxLength={2}
        value={stateInput}
        onChangeText={onStateInputChange}
      />

      <SurfaceTextField
        containerStyle={[styles.infoField, styles.infoFieldLast]}
        label="Business Bio (Optional)"
        multiline
        style={styles.bioInput}
        textAlignVertical="top"
        value={bioInput}
        onChangeText={onBioInputChange}
      />
    </View>
  );
}
