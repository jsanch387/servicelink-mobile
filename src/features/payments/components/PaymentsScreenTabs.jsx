import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { PAYMENTS_SCREEN_TAB_OPTIONS } from '../constants/paymentsScreenTabs';

const ACTIVE_BG = '#ffffff';
const ACTIVE_FG = '#000000';

/**
 * Payments screen tabs — white selector segment (distinct from graph range dropdown).
 *
 * @param {{
 *   value: string;
 *   onChange: (id: string) => void;
 * }} props
 */
export function PaymentsScreenTabs({ value, onChange }) {
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
          marginBottom: 8,
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
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        labelActive: {
          color: ACTIVE_FG,
          fontFamily: FONT_FAMILIES.bold,
          fontWeight: '700',
        },
      }),
    [colors, isDark],
  );

  return (
    <View accessibilityRole="tablist" style={styles.track}>
      {PAYMENTS_SCREEN_TAB_OPTIONS.map((opt) => {
        const selected = opt.id === value;
        return (
          <View key={opt.id} style={styles.tabHit}>
            <Pressable
              accessibilityLabel={opt.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              android_ripple={{
                borderless: false,
                color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              }}
              onPress={() => onChange(opt.id)}
              style={({ pressed }) => [pressed && !selected && { opacity: 0.8 }]}
            >
              <View style={[styles.tabFace, selected && styles.tabFaceActive]}>
                <AppText numberOfLines={1} style={[styles.label, selected && styles.labelActive]}>
                  {opt.label}
                </AppText>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
