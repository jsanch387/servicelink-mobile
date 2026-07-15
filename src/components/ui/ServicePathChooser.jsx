import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../../theme';
import { AppText } from './AppText';

function PathCard({ title, subtitle, icon, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          marginBottom: 12,
        },
        face: {
          alignItems: 'center',
          backgroundColor: colors.cardSurface,
          borderColor: colors.border,
          borderRadius: 18,
          borderWidth: 1.5,
          flexDirection: 'row',
          gap: 14,
          paddingHorizontal: 16,
          paddingVertical: 18,
        },
        iconWrap: {
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
        },
        textCol: {
          flex: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.25,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 20,
          marginTop: 4,
        },
      }),
    [colors],
  );

  return (
    <Pressable accessibilityRole="button" style={styles.press} onPress={onPress}>
      <View style={styles.face}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.textMuted} name={icon} size={24} />
        </View>
        <View style={styles.textCol}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        </View>
        <Ionicons color={colors.textMuted} name="chevron-forward" size={22} />
      </View>
    </Pressable>
  );
}

export function ServicePathChooser({ onChooseServices, onChooseCustomJob }) {
  return (
    <View>
      <PathCard
        icon="grid-outline"
        subtitle="Choose something you already offer."
        title="Your services"
        onPress={onChooseServices}
      />
      <PathCard
        icon="create-outline"
        subtitle="Name the work and set your own price."
        title="Custom job"
        onPress={onChooseCustomJob}
      />
    </View>
  );
}
