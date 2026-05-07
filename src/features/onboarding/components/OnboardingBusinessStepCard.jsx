import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { SelectField, SurfaceCard, SurfaceTextField } from '../../../components/ui';
import { BUSINESS_TYPE_OPTIONS } from '../../../constants/businessTypeOptions';

/**
 * Step 1: business display name + type (values held by parent until persistence exists).
 */
export function OnboardingBusinessStepCard({
  businessName,
  onBusinessNameChange,
  businessType,
  onBusinessTypeChange,
}) {
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
      }),
    [],
  );

  return (
    <SurfaceCard>
      <SurfaceTextField
        autoCapitalize="words"
        containerStyle={styles.nameField}
        label="Business name"
        onChangeText={onBusinessNameChange}
        placeholder="e.g. Sparkle Mobile Detailing"
        value={businessName}
      />

      <View style={styles.typeWrap}>
        <SelectField
          fieldStyle={styles.selectFlushTop}
          label="Business type"
          options={BUSINESS_TYPE_OPTIONS}
          placeholder="Select type"
          presentation="wheel"
          title="Business type"
          value={businessType || null}
          onValueChange={onBusinessTypeChange}
        />
      </View>
    </SurfaceCard>
  );
}
