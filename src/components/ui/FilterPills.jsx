import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/**
 * Horizontal chip selector (e.g. filter tabs). Used on Customers, Quotes, etc.
 *
 * @param {{ key: string; label: string }[]} options
 * @param {string} selectedKey
 * @param {(key: string) => void} onSelect
 * @param {'default' | 'large'} [size]
 */
export function FilterPills({ options, selectedKey, onSelect, size = 'default' }) {
  const { colors } = useTheme();
  const large = size === 'large';

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
          paddingHorizontal: large ? 13 : 10,
          paddingVertical: large ? 6 : 5,
        },
        pillActive: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        label: {
          color: colors.textMuted,
          fontSize: large ? 13 : 12,
          fontWeight: '600',
          letterSpacing: -0.05,
        },
        labelActive: {
          color: colors.shell,
        },
      }),
    [colors, large],
  );

  return (
    <View accessibilityRole="tablist" style={styles.row}>
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            hitSlop={{ top: 6, bottom: 6 }}
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
