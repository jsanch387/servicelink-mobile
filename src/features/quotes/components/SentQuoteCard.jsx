import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { getQuoteStatusPillTheme } from '../utils/quoteStatusPillTheme';

/**
 * @param {{
 *   customerName: string;
 *   line: string;
 *   statusLabel: string;
 *   statusRaw?: string;
 *   onPress?: () => void;
 * }} props
 */
export function SentQuoteCard({ customerName, line, statusLabel, statusRaw = '', onPress }) {
  const { colors, isDark } = useTheme();

  const pillTheme = useMemo(
    () => getQuoteStatusPillTheme(statusRaw, colors, isDark),
    [colors, isDark, statusRaw],
  );

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
        statusPill: {
          borderRadius: 999,
          borderWidth: 1,
          flexShrink: 0,
          paddingHorizontal: 10,
          paddingVertical: 5,
        },
        statusText: {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: -0.05,
        },
        serviceRow: {
          alignItems: 'flex-end',
          flexDirection: 'row',
          gap: 8,
          marginTop: 10,
        },
        line: {
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
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: pillTheme.backgroundColor,
              borderColor: pillTheme.borderColor,
            },
          ]}
        >
          <AppText style={[styles.statusText, { color: pillTheme.color }]}>{statusLabel}</AppText>
        </View>
      </View>
      <View style={styles.serviceRow}>
        <AppText numberOfLines={2} style={styles.line}>
          {line}
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
        accessibilityHint="Opens sent quote details"
        accessibilityLabel={`Sent quote for ${customerName}`}
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
