import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

/**
 * Full-width segmented control — same pattern as Services (Services / Categories / Add-ons).
 *
 * @param {object} props
 * @param {Array<{ key: string; label: string; iconName?: keyof typeof Ionicons.glyphMap }>} props.options
 * @param {string} props.selected
 * @param {(key: string) => void} props.onSelect
 */
export function SegmentedToggle({ options, selected, onSelect }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { borderColor: colors.border }]}>
      <View style={[styles.track, { backgroundColor: colors.shell }]}>
        {options.map((option) => {
          const isSelected = option.key === selected;
          const tone = isSelected ? colors.text : colors.textMuted;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              key={option.key}
              onPress={() => onSelect(option.key)}
              style={[
                styles.option,
                isSelected && {
                  backgroundColor: colors.cardSurface,
                  borderColor: 'transparent',
                },
              ]}
            >
              {option.iconName ? (
                <View style={styles.optionContent}>
                  <Ionicons color={tone} name={option.iconName} size={14} />
                  <AppText style={[styles.label, { color: tone }]}>{option.label}</AppText>
                </View>
              ) : (
                <AppText
                  style={[styles.label, { color: isSelected ? colors.text : colors.textMuted }]}
                >
                  {option.label}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    padding: 4,
  },
  track: {
    borderRadius: 10,
    flexDirection: 'row',
  },
  option: {
    alignItems: 'center',
    borderColor: 'transparent',
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  optionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
