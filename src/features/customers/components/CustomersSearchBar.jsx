import { SurfaceTextField } from '../../../components/ui';

/** Same centered placeholder treatment as the other form fields. */
export function CustomersSearchBar({ value, onChangeText }) {
  return (
    <SurfaceTextField
      accessibilityLabel="Search customers"
      autoCapitalize="none"
      autoCorrect={false}
      clearButtonMode="while-editing"
      containerStyle={searchFieldStyle}
      leftIcon="search-outline"
      placeholder="Search by name, email, or phone"
      returnKeyType="search"
      value={value}
      onChangeText={onChangeText}
    />
  );
}

const searchFieldStyle = {
  marginBottom: 14,
};
