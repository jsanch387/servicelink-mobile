import { View } from 'react-native';
import {
  AppText,
  AppTextInput,
  SelectField,
  SpecialtyChips,
  SurfaceCard,
  SurfaceTextField,
} from '../../../../components/ui';
import { useTheme } from '../../../../theme';
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
  const { colors } = useTheme();

  return (
    <View style={styles.bioSection}>
      <AppText style={styles.sectionTitle}>Business Bio (Optional)</AppText>
      <View style={[styles.multilineInputShell, styles.bioFieldWrap]}>
        <AppTextInput
          accessibilityLabel="Business bio"
          multiline
          nestedScrollEnabled
          placeholder="Tell customers about your business"
          placeholderTextColor={colors.placeholder}
          scrollEnabled
          style={styles.multilineInput}
          textAlignVertical="top"
          value={bioInput}
          onChangeText={onBioInputChange}
        />
      </View>
    </View>
  );
}
