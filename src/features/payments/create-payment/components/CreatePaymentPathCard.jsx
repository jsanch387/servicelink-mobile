import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * Dark choice tile for the Get paid chooser.
 */
export function CreatePaymentPathCard({
  icon,
  iconLibrary = 'ionicons',
  title,
  subtitle,
  eyebrow,
  onPress,
  testID,
  muted = false,
}) {
  const { colors, isDark } = useTheme();
  const Icon = iconLibrary === 'material-community' ? MaterialCommunityIcons : Ionicons;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        col: {
          flex: 1,
          minWidth: 0,
        },
        press: {
          flex: 1,
        },
        inner: {
          flex: 1,
        },
        face: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 20,
          borderWidth: StyleSheet.hairlineWidth,
          flex: 1,
          minHeight: 176,
          overflow: 'hidden',
          paddingHorizontal: 16,
          paddingVertical: 18,
        },
        facePressed: {
          opacity: 0.88,
        },
        iconWell: {
          alignItems: 'center',
          backgroundColor: isDark ? '#ffffff' : '#0a0a0a',
          borderRadius: 16,
          height: 52,
          justifyContent: 'center',
          marginBottom: 16,
          width: 52,
        },
        eyebrow: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 11,
          letterSpacing: 0.7,
          marginBottom: 6,
          textTransform: 'uppercase',
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 18,
          letterSpacing: -0.4,
          lineHeight: 22,
        },
        subtitle: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 13,
          lineHeight: 18,
          marginTop: 8,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.col}>
      <Pressable
        accessibilityLabel={title}
        accessibilityRole="button"
        style={styles.press}
        testID={testID}
        onPress={onPress}
      >
        {({ pressed }) => (
          <View style={[styles.inner, pressed && !muted && styles.facePressed]}>
            <View style={[styles.face, muted && { opacity: 0.5 }]}>
              <View style={styles.iconWell}>
                <Icon color={isDark ? '#0a0a0a' : '#ffffff'} name={icon} size={26} />
              </View>
              {eyebrow ? <AppText style={styles.eyebrow}>{eyebrow}</AppText> : null}
              <AppText style={styles.title}>{title}</AppText>
              <AppText style={styles.subtitle}>{subtitle}</AppText>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}
