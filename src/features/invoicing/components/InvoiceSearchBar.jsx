import { SurfaceTextField } from '../../../components/ui';

/**
 * @param {object} props
 * @param {string} props.value
 * @param {(text: string) => void} props.onChangeText
 */
export function InvoiceSearchBar({ value, onChangeText }) {
  return (
    <SurfaceTextField
      accessibilityLabel="Search invoices"
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="while-editing"
      containerStyle={searchFieldStyle}
      leftIcon="search-outline"
      placeholder="Search name, email, or invoice"
      returnKeyType="search"
      value={value}
      onChangeText={onChangeText}
    />
  );
}

const searchFieldStyle = {
  marginBottom: 0,
};
