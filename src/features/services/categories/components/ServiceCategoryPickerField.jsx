import { StyleSheet, View } from 'react-native';
import { AppText, SelectField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Optional category assignment — used on create-service sheet and similar forms.
 *
 * @param {{
 *   options: { value: string; label: string }[];
 *   value: string;
 *   onValueChange: (id: string) => void;
 *   hint?: string | null;
 * }} props
 */
export function ServiceCategoryPickerField({
  options,
  value,
  onValueChange,
  hint = 'Optional. Helps customers browse by group on your booking link.',
}) {
  const { colors } = useTheme();

  if (!options?.length) return null;

  return (
    <View style={styles.root}>
      <SelectField
        fieldStyle={styles.pickerField}
        options={options}
        placeholder="None"
        presentation="wheel"
        title="Category"
        value={value || ''}
        onValueChange={onValueChange}
      />
      {hint ? <AppText style={[styles.hint, { color: colors.textMuted }]}>{hint}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginBottom: 0,
  },
  pickerField: {
    marginBottom: 6,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
});
