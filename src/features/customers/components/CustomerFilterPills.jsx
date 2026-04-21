import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

export function CustomerFilterPills({ options, selectedKey, onSelect }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          gap: 10,
          marginBottom: 14,
        },
        pill: {
          borderColor: colors.cardBorder,
          borderRadius: 999,
          borderWidth: 1.5,
          paddingHorizontal: 16,
          paddingVertical: 8,
        },
        pillActive: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        label: {
          color: colors.textMuted,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.1,
        },
        labelActive: {
          color: colors.shell,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            style={[styles.pill, isSelected && styles.pillActive]}
          >
            <Text style={[styles.label, isSelected && styles.labelActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
