import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';

export const ENTITY_VIEW_SERVICES = 'services';
export const ENTITY_VIEW_ADDONS = 'addons';

const OPTIONS = [
  { key: ENTITY_VIEW_SERVICES, label: 'Services' },
  { key: ENTITY_VIEW_ADDONS, label: 'Add-ons' },
];

export function SegmentedEntityToggle({ selected, onSelect }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrapper, { borderColor: colors.border }]}>
      <View style={[styles.track, { backgroundColor: colors.shell }]}>
        {OPTIONS.map((option) => {
          const isSelected = option.key === selected;
          return (
            <Pressable
              accessibilityRole="button"
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
              <AppText
                style={[styles.label, { color: isSelected ? colors.text : colors.textMuted }]}
              >
                {option.label}
              </AppText>
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
    marginTop: 0,
    marginBottom: 0,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
