import { StyleSheet, View } from 'react-native';
import { AppText, SelectField } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Optional category assignment — used on the new-service screen and similar forms.
 *
 * @param {{
 *   options: { value: string; label: string }[];
 *   value: string;
 *   onValueChange: (id: string) => void;
 *   label?: string | null;
 *   hint?: string | null;
 * }} props
 */
export function ServiceCategoryPickerField({
  options,
  value,
  onValueChange,
  label = 'Category',
  hint = null,
}) {
  const { colors } = useTheme();

  if (!options?.length) return null;

  return (
    <View style={styles.root}>
      <SelectField
        fieldStyle={styles.pickerField}
        label={label || undefined}
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
    marginBottom: 0,
    marginTop: 0,
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 8,
  },
});
