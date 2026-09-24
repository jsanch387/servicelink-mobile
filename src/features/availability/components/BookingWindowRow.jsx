import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * Booking timing card: title + info, hint, then a dropdown field for the value.
 *
 * @param {{
 *   title: string;
 *   hint: string;
 *   valueLabel: string;
 *   infoLabel: string;
 *   onPress: () => void;
 *   onInfoPress: () => void;
 * }} props
 */
export function BookingWindowRow({ title, hint, valueLabel, infoLabel, onPress, onInfoPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderRadius: 16,
          overflow: 'hidden',
          paddingHorizontal: 16,
          paddingVertical: 16,
        },
        headerRow: {
          alignItems: 'flex-start',
          flexDirection: 'row',
          width: '100%',
        },
        titleCol: {
          flex: 1,
          minWidth: 0,
          paddingRight: 12,
        },
        title: {
          color: colors.text,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.3,
          lineHeight: 22,
        },
        infoHit: {
          alignItems: 'center',
          height: 28,
          justifyContent: 'center',
          marginRight: -4,
          marginTop: -3,
          width: 28,
        },
        hint: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 17,
          marginTop: 4,
        },
        trigger: {
          marginTop: 14,
        },
        triggerShell: {
          alignItems: 'center',
          backgroundColor: colors.inputBg,
          borderColor: colors.inputBorder,
          borderRadius: 14,
          borderWidth: 1,
          flexDirection: 'row',
          minHeight: 48,
          paddingHorizontal: 14,
          width: '100%',
        },
        triggerPressed: {
          opacity: 0.88,
        },
        valueCol: {
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          paddingRight: 10,
        },
        value: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '500',
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
    <SurfaceCard padding="none" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleCol}>
          <AppText numberOfLines={1} style={styles.title}>
            {title}
          </AppText>
          <AppText style={styles.hint}>{hint}</AppText>
        </View>
        <Pressable
          accessibilityHint="Opens a short example of how this setting works"
          accessibilityLabel={infoLabel}
          accessibilityRole="button"
          hitSlop={8}
          style={styles.infoHit}
          onPress={onInfoPress}
        >
          <Ionicons color={colors.textMuted} name="information-circle-outline" size={20} />
        </Pressable>
      </View>
      <Pressable
        accessibilityHint="Opens a picker to change this value"
        accessibilityLabel={`${title}, currently ${valueLabel}`}
        accessibilityRole="button"
        style={styles.trigger}
        onPress={onPress}
      >
        {({ pressed }) => (
          <View style={[styles.triggerShell, pressed && styles.triggerPressed]}>
            <View style={styles.valueCol}>
              <AppText numberOfLines={1} style={styles.value}>
                {valueLabel}
              </AppText>
            </View>
            <View style={styles.chevronCol}>
              <Ionicons color={colors.textMuted} name="chevron-down" size={18} />
            </View>
          </View>
        )}
      </Pressable>
    </SurfaceCard>
  );
}
