import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Tappable row with optional subtitle and trailing label (e.g. price).
 * @param {import('react-native').AccessibilityRole} [accessibilityRole]
 */
export function ChoiceRow({
  selected,
  onPress,
  title,
  subtitle,
  rightLabel,
  accessibilityRole = 'button',
}) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          marginBottom: 10,
        },
        face: {
          alignItems: 'center',
          borderRadius: 14,
          borderWidth: 1.5,
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '600',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          marginTop: 2,
        },
        right: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '600',
        },
      }),
    [colors],
  );

  const borderColor = selected ? colors.accent : colors.border;
  const backgroundColor = selected ? colors.buttonGhostPressed : colors.surface;

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected }}
      style={styles.press}
      onPress={onPress}
    >
      <View style={[styles.face, { backgroundColor, borderColor }]}>
        <Ionicons
          color={selected ? colors.accent : colors.textMuted}
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
        />
        <View style={styles.textCol}>
          <AppText numberOfLines={2} style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText numberOfLines={2} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {rightLabel ? <AppText style={styles.right}>{rightLabel}</AppText> : null}
      </View>
    </Pressable>
  );
}
