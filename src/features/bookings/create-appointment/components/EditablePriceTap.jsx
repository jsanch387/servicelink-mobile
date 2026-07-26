import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Header action to open the edit-price sheet (icon + label).
 *
 * @param {{
 *   onPress: () => void;
 *   accessibilityLabel?: string;
 * }} props
 */
export function EditablePriceTap({ onPress, accessibilityLabel }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 5,
          paddingVertical: 2,
        },
        label: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? 'Edit price'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[styles.press, pressed ? { opacity: 0.65 } : null]}>
          <Ionicons color={colors.textMuted} name="create-outline" size={16} />
          <AppText style={styles.label}>Edit Price</AppText>
        </View>
      )}
    </Pressable>
  );
}
