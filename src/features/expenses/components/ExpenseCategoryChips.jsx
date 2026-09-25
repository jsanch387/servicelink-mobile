import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { EXPENSE_CATEGORY_OPTIONS } from '../constants/expenseCategories';

export function ExpenseCategoryChips({ value, onChange }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: 8,
        },
        sectionLabel: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
        },
        chips: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        },
        chip: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 999,
          borderWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        chipActive: {
          backgroundColor: colors.accent,
          borderColor: colors.accent,
        },
        label: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
        labelActive: {
          color: colors.shell,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <AppText style={styles.sectionLabel}>Category</AppText>
      <View accessibilityLabel="Category" accessibilityRole="tablist" style={styles.chips}>
        {EXPENSE_CATEGORY_OPTIONS.map((option) => {
          const selected = option.key === value;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.key)}
              style={[styles.chip, selected && styles.chipActive]}
            >
              <AppText style={[styles.label, selected && styles.labelActive]}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
