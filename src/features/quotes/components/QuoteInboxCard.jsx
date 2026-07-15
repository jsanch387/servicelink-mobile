import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { getQuoteStatusPillTheme } from '../utils/quoteStatusPillTheme';

/**
 * Shared, compact quote card for requests and sent quotes.
 *
 * @param {object} props
 * @param {'request' | 'sent'} props.variant
 * @param {string} props.customerName
 * @param {string} props.title
 * @param {string} [props.summary]
 * @param {string} [props.vehicleLabel]
 * @param {string} props.timestampLabel
 * @param {string} props.statusLabel
 * @param {string} props.statusRaw
 * @param {() => void} props.onPress
 */
export function QuoteInboxCard({
  variant,
  customerName,
  title,
  summary = '',
  vehicleLabel = '',
  timestampLabel,
  statusLabel,
  statusRaw,
  onPress,
}) {
  const { colors, isDark } = useTheme();
  const pillTheme = useMemo(
    () => getQuoteStatusPillTheme(statusRaw, colors, isDark),
    [colors, isDark, statusRaw],
  );
  const secondaryText = summary || vehicleLabel;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: {
          borderRadius: 16,
        },
        card: {
          paddingHorizontal: 16,
          paddingVertical: 15,
        },
        header: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        customerName: {
          color: colors.text,
          flex: 1,
          fontSize: 16,
          fontWeight: '700',
          letterSpacing: -0.25,
          minWidth: 0,
        },
        statusPill: {
          borderRadius: 999,
          borderWidth: 1,
          flexShrink: 0,
          paddingHorizontal: 8,
          paddingVertical: 4,
        },
        statusText: {
          fontSize: 10,
          fontWeight: '700',
        },
        timestamp: {
          color: colors.textMuted,
          fontSize: 12,
          fontWeight: '500',
          marginTop: 5,
        },
        details: {
          marginTop: 12,
          minWidth: 0,
        },
        lastLine: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
        },
        title: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
          lineHeight: 19,
          minWidth: 0,
        },
        secondary: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 13,
          lineHeight: 18,
          minWidth: 0,
        },
        secondaryLine: {
          marginTop: 4,
        },
        chevron: {
          flexShrink: 0,
        },
      }),
    [colors],
  );

  return (
    <Pressable
      accessibilityHint={
        variant === 'request' ? 'Opens quote request details' : 'Opens sent quote details'
      }
      accessibilityLabel={`Quote for ${customerName}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pressable, pressed && { opacity: 0.92 }]}
      onPress={onPress}
    >
      <SurfaceCard padding="none" style={styles.card}>
        <View style={styles.header}>
          <AppText numberOfLines={1} style={styles.customerName}>
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
        {timestampLabel ? <AppText style={styles.timestamp}>{timestampLabel}</AppText> : null}

        <View style={styles.details}>
          {secondaryText ? (
            <>
              <AppText numberOfLines={2} style={styles.title}>
                {title}
              </AppText>
              <View style={[styles.lastLine, styles.secondaryLine]}>
                <AppText numberOfLines={summary ? 2 : 1} style={styles.secondary}>
                  {secondaryText}
                </AppText>
                <Ionicons
                  accessibilityElementsHidden
                  color={colors.textMuted}
                  name="chevron-forward"
                  size={20}
                  style={styles.chevron}
                />
              </View>
            </>
          ) : (
            <View style={styles.lastLine}>
              <AppText numberOfLines={2} style={styles.title}>
                {title}
              </AppText>
              <Ionicons
                accessibilityElementsHidden
                color={colors.textMuted}
                name="chevron-forward"
                size={20}
                style={styles.chevron}
              />
            </View>
          )}
        </View>
      </SurfaceCard>
    </Pressable>
  );
}
