import { Pressable, View } from 'react-native';
import { AppText } from '../../../../components/ui';

/**
 * Compact segmented control for booking-tab settings (service type, default language).
 */
export function BookingLinkEditInlineSegment({
  accessibilityLabel,
  compact = false,
  options,
  selectedKey,
  onSelect,
  styles,
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="radiogroup"
      style={[styles.inlineSegmentTrack, compact && styles.inlineSegmentTrackCompact]}
    >
      {options.map((option) => {
        const isSelected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.inlineSegmentOption,
              compact && styles.inlineSegmentOptionCompact,
              isSelected && styles.inlineSegmentOptionActive,
            ]}
            onPress={() => onSelect(option.key)}
          >
            <AppText
              numberOfLines={1}
              style={[styles.inlineSegmentLabel, isSelected && styles.inlineSegmentLabelActive]}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}
