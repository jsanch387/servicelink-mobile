import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { useTheme } from '../../../../theme';

/**
 * Equal-height path row — same surface as the rest of settings-style lists.
 */
export function CreatePaymentPathCard({
  icon,
  iconLibrary = 'ionicons',
  title,
  subtitle,
  onPress,
  testID,
  muted = false,
}) {
  const { colors } = useTheme();
  const Icon = iconLibrary === 'material-community' ? MaterialCommunityIcons : Ionicons;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          marginBottom: 10,
        },
        face: {
          alignItems: 'center',
          borderColor: colors.border,
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        iconCircle: {
          alignItems: 'center',
          backgroundColor: '#ffffff',
          borderRadius: 12,
          height: 48,
          justifyContent: 'center',
          width: 48,
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.3,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '400',
          lineHeight: 19,
          marginTop: 3,
        },
        chevronCol: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      style={styles.press}
      testID={testID}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.face,
            { backgroundColor: colors.surface, opacity: muted ? 0.5 : pressed ? 0.88 : 1 },
          ]}
        >
          <View style={styles.iconCircle}>
            <Icon color="#0a0a0a" name={icon} size={24} />
          </View>
          <View style={styles.textCol}>
            <AppText style={styles.title}>{title}</AppText>
            <AppText style={styles.subtitle}>{subtitle}</AppText>
          </View>
          <View style={styles.chevronCol}>
            <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
          </View>
        </View>
      )}
    </Pressable>
  );
}
