import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

/**
 * @param {{ customerName: string; summary: string; receivedLabel: string; onPress?: () => void }} props
 */
export function QuoteRequestCard({ customerName, summary, receivedLabel, onPress }) {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          borderRadius: 16,
        },
        nameRow: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        name: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '600',
          letterSpacing: -0.2,
          minWidth: 0,
        },
        pill: {
          backgroundColor: colors.cardSurface,
          borderColor: colors.borderStrong,
          borderRadius: 999,
          borderWidth: 1,
          flexShrink: 0,
          paddingHorizontal: 10,
          paddingVertical: 4,
        },
        pillText: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.15,
        },
        meta: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.05,
          marginTop: 6,
        },
        serviceRow: {
          alignItems: 'flex-end',
          flexDirection: 'row',
          gap: 8,
          marginTop: 10,
        },
        summary: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 14,
          fontWeight: '500',
          letterSpacing: -0.1,
          lineHeight: 20,
          minWidth: 0,
        },
        chevronWrap: {
          alignItems: 'center',
          flexShrink: 0,
          justifyContent: 'flex-end',
          paddingBottom: 1,
          width: 24,
        },
      }),
    [colors],
  );

  const inner = (
    <SurfaceCard padding="md">
      <View style={styles.nameRow}>
        <AppText numberOfLines={2} style={styles.name}>
          {customerName}
        </AppText>
        <View style={styles.pill}>
          <AppText style={styles.pillText}>Request</AppText>
        </View>
      </View>
      <AppText style={styles.meta}>{receivedLabel}</AppText>
      <View style={styles.serviceRow}>
        <AppText numberOfLines={2} style={styles.summary}>
          {summary}
        </AppText>
        <View accessibilityElementsHidden accessible={false} style={styles.chevronWrap}>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={22} />
        </View>
      </View>
    </SurfaceCard>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityHint="Opens quote request details"
        accessibilityLabel={`Quote request from ${customerName}`}
        accessibilityRole="button"
        style={({ pressed }) => [styles.press, pressed && { opacity: 0.92 }]}
        onPress={onPress}
      >
        {inner}
      </Pressable>
    );
  }

  return inner;
}
