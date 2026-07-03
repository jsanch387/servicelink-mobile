import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppText, SurfaceCard } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';

/**
 * App Store / Play update nudge — compact frosted row on the home shell.
 *
 * @param {{
 *   minimumVersion: string;
 *   onPressUpdate: () => void | Promise<void>;
 * }} props
 */
export function StoreUpdateBanner({ minimumVersion, onPressUpdate }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          alignSelf: 'stretch',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          overflow: 'hidden',
          padding: 0,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDark ? 0.18 : 0.07,
              shadowRadius: 10,
            },
            android: {
              elevation: 2,
            },
            default: {},
          }),
        },
        pressable: {
          alignSelf: 'stretch',
          overflow: 'hidden',
          width: '100%',
        },
        row: {
          alignItems: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          width: '100%',
        },
        rowPressed: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        },
        iconBadge: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.72)',
          borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)',
          borderRadius: 10,
          borderWidth: StyleSheet.hairlineWidth,
          height: 34,
          justifyContent: 'center',
          width: 34,
        },
        copy: {
          flex: 1,
          gap: 2,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.12,
          lineHeight: 17,
        },
        body: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          lineHeight: 15,
        },
        chevronCol: {
          alignItems: 'center',
          height: 20,
          justifyContent: 'center',
          marginLeft: 4,
          width: 20,
        },
      }),
    [colors, isDark],
  );

  return (
    <SurfaceCard accessibilityRole="alert" outlined padding="none" style={styles.card}>
      <Pressable
        accessibilityHint="Opens the App Store"
        accessibilityLabel={`Update available. Version ${minimumVersion} is ready.`}
        accessibilityRole="button"
        onPress={() => {
          void onPressUpdate();
        }}
        style={styles.pressable}
      >
        {({ pressed }) => (
          <View style={[styles.row, pressed && styles.rowPressed]}>
            <View style={styles.iconBadge}>
              <Ionicons color={colors.text} name="arrow-down-circle-outline" size={19} />
            </View>
            <View style={styles.copy}>
              <AppText includeFontPadding={false} style={styles.title}>
                Update available
              </AppText>
              <AppText includeFontPadding={false} style={styles.body}>
                Get the latest update
              </AppText>
            </View>
            <View style={styles.chevronCol}>
              <Ionicons color={colors.textMuted} name="chevron-forward" size={16} />
            </View>
          </View>
        )}
      </Pressable>
    </SurfaceCard>
  );
}
