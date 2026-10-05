import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Trash control for the navigation bar, on the trailing side.
 *
 * @param {object} props
 * @param {() => void} props.onPress
 */
export function InvoiceHeaderDeleteButton({ onPress }) {
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
      }),
    [],
  );

  return (
    <Pressable accessibilityLabel="Delete invoice" accessibilityRole="button" onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.face, pressed && styles.pressed]}>
          <Ionicons color={colors.danger} name="trash-outline" size={22} />
        </View>
      )}
    </Pressable>
  );
}
