import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * @param {{ label: string; onPress: () => void; accessibilityHint?: string }} props
 */
export function CatalogHowItWorksLink({ label, onPress, accessibilityHint }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 10,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 8,
          marginBottom: 10,
          paddingHorizontal: 10,
          paddingVertical: 8,
        },
        label: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      onPress={onPress}
      style={styles.press}
    >
      <Ionicons color={colors.textMuted} name="information-circle-outline" size={16} />
      <AppText style={styles.label}>{label}</AppText>
      <Ionicons color={colors.textMuted} name="chevron-forward" size={14} />
    </Pressable>
  );
}
