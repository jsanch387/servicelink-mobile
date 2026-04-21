import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';

/** Matches `SurfaceCard`: `cardSurface`, same corner radius, no stroke. */
export function CustomersSearchBar({ value, onChangeText }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderRadius: 16,
          flexDirection: 'row',
          marginBottom: 14,
          minHeight: 40,
          paddingHorizontal: 10,
          paddingVertical: 6,
        },
        input: {
          color: colors.text,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          minHeight: 36,
          paddingLeft: 6,
          paddingRight: 4,
          paddingVertical: Platform.select({ android: 6, default: 8 }),
          ...Platform.select({
            android: { includeFontPadding: false },
            default: {},
          }),
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Ionicons color={colors.textMuted} name="search-outline" size={18} />
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
