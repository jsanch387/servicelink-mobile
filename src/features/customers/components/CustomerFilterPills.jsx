import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';

export function CustomerFilterPills({ options, selectedKey, onSelect }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        pill: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.cardBorder,
          borderRadius: 999,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        pillActive: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        label: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.05,
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
            <AppText style={[styles.label, isSelected && styles.labelActive]}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
