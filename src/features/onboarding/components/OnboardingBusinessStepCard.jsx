import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SelectField, SurfaceCard, SurfaceTextField } from '../../../components/ui';
import { BUSINESS_TYPE_OPTIONS } from '../../../constants/businessTypeOptions';
import { useTheme } from '../../../theme';

/**
 * Step 1: business display name + type (values held by parent until persistence exists).
 */
export function OnboardingBusinessStepCard({
  businessName,
  onBusinessNameChange,
  businessType,
  onBusinessTypeChange,
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardTitle: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          marginBottom: 4,
        },
        cardHint: {
          color: colors.textMuted,
          fontSize: 14,
          lineHeight: 20,
          marginBottom: 18,
        },
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
    [colors],
  );

  return (
    <SurfaceCard>
      <AppText style={styles.cardTitle}>Business details</AppText>
      <AppText style={styles.cardHint}>
        What should we call your business, and what do you do?
      </AppText>

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
