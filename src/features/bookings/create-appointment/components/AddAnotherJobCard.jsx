import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Full-width secondary action to add another job to the visit.
 *
 * @param {{
 *   onPress: () => void;
 *   disabled?: boolean;
 *   label?: string;
 * }} props
 */
export function AddAnotherJobCard({ onPress, disabled = false, label = 'Add another job' }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          opacity: disabled ? 0.45 : 1,
        },
        face: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
          borderColor: colors.border,
          borderRadius: 14,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          flexDirection: 'row',
          gap: 10,
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        label: {
          color: colors.accent,
          fontSize: 16,
          fontWeight: '600',
        },
      }),
    [colors, isDark],
  );

  return (
    <Pressable
      accessibilityLabel="Add another job to this visit"
      accessibilityRole="button"
      disabled={disabled}
      style={styles.press}
      onPress={onPress}
    >
      <View style={styles.face}>
        <Ionicons color={colors.accent} name="add" size={22} />
        <AppText style={styles.label}>{label}</AppText>
      </View>
    </Pressable>
  );
}
