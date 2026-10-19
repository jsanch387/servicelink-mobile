import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Trash control for the service editor navigation bar.
 *
 * @param {object} props
 * @param {() => void} props.onPress
 * @param {boolean} [props.disabled]
 */
export function ServiceHeaderDeleteButton({ onPress, disabled = false }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        face: {
          alignItems: 'center',
          height: 34,
          justifyContent: 'center',
          width: 34,
        },
        pressed: {
          opacity: 0.55,
        },
        disabled: {
          opacity: 0.4,
        },
      }),
    [],
  );

  return (
    <Pressable
      accessibilityLabel="Delete service"
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[styles.face, pressed && styles.pressed, disabled && styles.disabled]}>
          <Ionicons color={colors.danger} name="trash-outline" size={22} />
        </View>
      )}
    </Pressable>
  );
}
