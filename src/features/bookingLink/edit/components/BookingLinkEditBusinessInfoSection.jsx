import { View } from 'react-native';
import {
  AppText,
  SelectField,
  SpecialtyChips,
  SurfaceCard,
  SurfaceTextField,
} from '../../../../components/ui';
import { getSpecialtiesForBusinessType } from '../../../../constants/businessSpecialties';

export function BookingLinkEditBusinessInfoSection({
  styles,
  rootStyle,
  nameInput,
  onNameInputChange,
  businessTypeOptions,
  typeInput,
  onTypeInputChange,
  specialtiesInput,
  onSpecialtiesChange,
  specialtyError,
}) {
  const specialtyOptions = typeInput ? getSpecialtiesForBusinessType(typeInput) : [];

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

        <View style={styles.infoFieldLast}>
          <SelectField
            fieldStyle={styles.infoSelectFieldFlushTop}
            label="Business type"
            options={businessTypeOptions}
            presentation="wheel"
            value={typeInput}
            onValueChange={onTypeInputChange}
          />
          {specialtyOptions.length > 0 ? (
            <SpecialtyChips
              error={specialtyError}
              options={specialtyOptions}
              value={specialtiesInput}
              onChange={onSpecialtiesChange}
            />
          ) : null}
        </View>
      </SurfaceCard>
    </View>
  );
}

export function BookingLinkEditBioSection({ styles, bioInput, onBioInputChange }) {
  return (
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
  );
}
