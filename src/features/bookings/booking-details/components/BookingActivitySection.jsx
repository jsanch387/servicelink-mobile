import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * Quiet doorway to customer texts and emails — not a full section.
 *
 * @param {object} props
 * @param {() => void} props.onPress
 */
export function BookingActivitySection({ onPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          minHeight: 44,
          paddingVertical: 4,
          width: '100%',
        },
        pressed: {
          opacity: 0.72,
        },
        labelCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
        },
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          fontWeight: '500',
          letterSpacing: -0.15,
        },
        chevronCol: {
          alignItems: 'center',
          height: 22,
          justifyContent: 'center',
          width: 22,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityHint="See texts and emails we sent your customer"
      accessibilityLabel="Texts and emails"
      accessibilityRole="button"
      style={styles.press}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View style={[styles.row, pressed && styles.pressed]}>
          <View style={styles.labelCol}>
            <AppText numberOfLines={1} style={styles.label}>
              Texts and emails
            </AppText>
          </View>
          <View style={styles.chevronCol}>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={16} />
          </View>
        </View>
      )}
    </Pressable>
  );
}
