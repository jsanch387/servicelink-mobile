import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SelectField, SpecialtyChips, SurfaceCard, SurfaceTextField } from '../../../components/ui';
import { getSpecialtiesForBusinessType } from '../../../constants/businessSpecialties';
import { getBusinessTypeSelectOptions } from '../../../constants/businessTypes';
import { MAX_ONBOARDING_BUSINESS_NAME_LENGTH } from '../constants/onboardingInputLimits';

const FIELD_GAP = 20;

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
        stack: {
          gap: FIELD_GAP,
        },
        flush: {
          marginBottom: 0,
          marginTop: 0,
        },
      }),
    [],
  );

  return (
    <SurfaceCard>
      <View style={styles.stack}>
        <SurfaceTextField
          autoCapitalize="words"
          containerStyle={styles.flush}
          label="Business name"
          maxLength={MAX_ONBOARDING_BUSINESS_NAME_LENGTH}
          onChangeText={onBusinessNameChange}
          placeholder="Your business name"
          value={businessName}
        />

        <SelectField
          fieldStyle={styles.flush}
          label="Industry"
          options={getBusinessTypeSelectOptions(businessType)}
          placeholder="Pick one"
          presentation="wheel"
          title="Industry"
          value={businessType || null}
          onValueChange={onBusinessTypeChange}
        />

        {specialtyOptions.length > 0 ? (
          <SpecialtyChips
            error={specialtyError}
            fieldStyle={styles.flush}
            options={specialtyOptions}
            value={specialties}
            onChange={onSpecialtiesChange}
          />
        ) : null}
      </View>
    </SurfaceCard>
  );
}
