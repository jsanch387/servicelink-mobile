import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SelectField, SpecialtyChips, SurfaceCard, SurfaceTextField } from '../../../components/ui';
import { getSpecialtiesForBusinessType } from '../../../constants/businessSpecialties';
import { getBusinessTypeSelectOptions } from '../../../constants/businessTypes';
import { MAX_ONBOARDING_BUSINESS_NAME_LENGTH } from '../constants/onboardingInputLimits';

/**
 * Step 1: business name, industry, and niches.
 */
export function OnboardingBusinessStepCard({
  businessName,
  onBusinessNameChange,
  businessType,
  onBusinessTypeChange,
  specialties,
  onSpecialtiesChange,
  specialtyError,
}) {
  const specialtyOptions = businessType ? getSpecialtiesForBusinessType(businessType) : [];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        nameField: {
          marginBottom: 4,
        },
        typeWrap: {
          marginTop: 0,
        },
        selectFlushTop: {
          marginTop: 0,
        },
        chipsWrap: {
          marginTop: 0,
        },
      }),
    [],
  );

  return (
    <SurfaceCard>
      <SurfaceTextField
        autoCapitalize="words"
        containerStyle={styles.nameField}
        label="Business name"
        maxLength={MAX_ONBOARDING_BUSINESS_NAME_LENGTH}
        onChangeText={onBusinessNameChange}
        placeholder="e.g. your business name"
        value={businessName}
      />

      <View style={styles.typeWrap}>
        <SelectField
          fieldStyle={styles.selectFlushTop}
          label="Business type"
          options={getBusinessTypeSelectOptions(businessType)}
          placeholder="Pick one"
          presentation="wheel"
          title="Business type"
          value={businessType || null}
          onValueChange={onBusinessTypeChange}
        />
      </View>

      {specialtyOptions.length > 0 ? (
        <View style={styles.chipsWrap}>
          <SpecialtyChips
            error={specialtyError}
            options={specialtyOptions}
            value={specialties}
            onChange={onSpecialtiesChange}
          />
        </View>
      ) : null}
    </SurfaceCard>
  );
}
