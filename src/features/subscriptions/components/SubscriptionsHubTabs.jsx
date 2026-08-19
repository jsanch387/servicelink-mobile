import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { SUBSCRIPTIONS_HUB_OPTIONS, SUBSCRIPTIONS_HUB_SUBSCRIBERS } from '../constants';

const ACTIVE_BG = '#ffffff';
const ACTIVE_FG = '#000000';

/**
 * Hub tabs — same white-segment pattern as Payments (Plans | Subscribers).
 * @param {{
 *   value: string;
 *   onChange: (id: string) => void;
 *   subscribersAttention?: boolean;
 * }} props
 */
export function SubscriptionsHubTabs({ value, onChange, subscribersAttention = false }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        track: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.buttonSecondaryBg,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.borderStrong,
          borderRadius: 14,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 4,
          marginBottom: 14,
          padding: 4,
        },
        tabHit: {
          borderRadius: 11,
          flex: 1,
          overflow: 'hidden',
        },
        tabFace: {
          alignItems: 'center',
          borderColor: 'transparent',
          borderRadius: 11,
          borderWidth: StyleSheet.hairlineWidth,
          flexDirection: 'row',
          gap: 6,
          justifyContent: 'center',
          minHeight: 40,
          paddingHorizontal: 4,
          paddingVertical: 10,
        },
        tabFaceActive: {
          backgroundColor: ACTIVE_BG,
          borderColor: isDark ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.1)',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0.28 : 0.12,
              shadowRadius: 3,
            },
            default: { elevation: 2 },
          }),
        },
        label: {
          color: colors.textMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        labelActive: {
          color: ACTIVE_FG,
          fontFamily: FONT_FAMILIES.bold,
          fontWeight: '700',
        },
        attentionDot: {
          backgroundColor: isDark ? '#FBBF24' : '#F59E0B',
          borderRadius: 4,
          height: 8,
          width: 8,
        },
      }),
    [colors, isDark],
  );

  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {SUBSCRIPTIONS_HUB_OPTIONS.map((opt) => {
        const selected = opt.key === value;
        const showDot = subscribersAttention && opt.key === SUBSCRIPTIONS_HUB_SUBSCRIBERS;
        return (
          <View key={opt.key} style={styles.tabHit}>
            <Pressable
              accessibilityLabel={showDot ? `${opt.label}, needs attention` : opt.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              android_ripple={{
                borderless: false,
                color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              }}
              style={({ pressed }) => [pressed && !selected && { opacity: 0.8 }]}
              onPress={() => onChange(opt.key)}
            >
              <View style={[styles.tabFace, selected && styles.tabFaceActive]}>
                <AppText numberOfLines={1} style={[styles.label, selected && styles.labelActive]}>
                  {opt.label}
                </AppText>
                {showDot ? (
                  <View
                    accessibilityElementsHidden
                    importantForAccessibility="no"
                    style={styles.attentionDot}
                  />
                ) : null}
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
