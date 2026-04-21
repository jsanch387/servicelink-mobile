import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';

export function CustomersSearchBar({ value, onChangeText }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          borderRadius: 16,
          borderWidth: 1.5,
          flexDirection: 'row',
          marginBottom: 12,
          paddingHorizontal: 12,
        },
        input: {
          color: colors.inputText,
          flex: 1,
          fontSize: 16,
          fontWeight: '500',
          minHeight: 48,
          paddingLeft: 8,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Ionicons color={colors.placeholder} name="search-outline" size={22} />
      <TextInput
        onChangeText={onChangeText}
        placeholder="Search by customer name..."
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        value={value}
      />
    </View>
  );
}
