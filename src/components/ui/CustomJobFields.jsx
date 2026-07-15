import { StyleSheet, View } from 'react-native';
import { DurationSelectField } from './DurationSelectField';
import { RequiredFieldLabel } from './RequiredFieldLabel';
import { SurfaceTextField } from './SurfaceTextField';

const styles = StyleSheet.create({
  fields: {
    gap: 20,
  },
});

export function normalizeCustomJobPriceInput(rawText, maxLength = 10) {
  const input = String(rawText ?? '').replace(/\$/g, '');
  let output = '';
  let dotSeen = false;
  for (const character of input) {
    if (character >= '0' && character <= '9') {
      output += character;
    } else if (character === '.' && !dotSeen) {
      output += character;
      dotSeen = true;
    }
  }
  return output.slice(0, maxLength);
}

export function CustomJobFields({
  serviceName,
  onServiceNameChange,
  priceUsdText,
  priceErrorText,
  onPriceUsdTextChange,
  durationHhMm,
  onDurationHhMmChange,
  serviceNameMaxLength = 120,
  priceInputMaxLength = 10,
}) {
  return (
    <View style={styles.fields}>
      <SurfaceTextField
        containerStyle={{ marginBottom: 0 }}
        label={<RequiredFieldLabel text="Service" />}
        maxLength={serviceNameMaxLength}
        onChangeText={onServiceNameChange}
        placeholder="e.g. Full interior + exterior"
        value={serviceName}
      />
      <SurfaceTextField
        containerStyle={{ marginBottom: 0 }}
        errorText={priceErrorText}
        keyboardType="decimal-pad"
        label={<RequiredFieldLabel text="Price (USD)" />}
        maxLength={priceInputMaxLength}
        onChangeText={(value) =>
          onPriceUsdTextChange(normalizeCustomJobPriceInput(value, priceInputMaxLength))
        }
        placeholder="0.00"
        prefixText="$"
        style={{ paddingLeft: 2 }}
        value={priceUsdText}
      />
      <DurationSelectField
        containerStyle={{ marginBottom: 0, marginTop: 0 }}
        label={<RequiredFieldLabel text="Duration" />}
        mode="service"
        onValueChange={onDurationHhMmChange}
        value={durationHhMm}
      />
    </View>
  );
}
