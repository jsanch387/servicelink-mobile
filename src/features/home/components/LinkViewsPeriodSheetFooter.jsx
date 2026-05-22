import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { linkViewsPeriodAccessCopy } from '../constants/linkViewsAccessCopy';

/**
 * Bottom-sheet footer for free users — account changes happen on web (App Store–safe).
 */
export function LinkViewsPeriodSheetFooter({ onWebSignInPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        footer: {
          marginTop: 4,
          paddingTop: 12,
        },
        body: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
        },
        actionRow: {
          alignItems: 'center',
          alignSelf: 'flex-start',
          flexDirection: 'row',
          marginTop: 10,
        },
        action: {
          color: colors.link,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
        actionPressed: {
          opacity: 0.72,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.footer}>
      <AppText style={styles.body}>{linkViewsPeriodAccessCopy.sheetFooter}</AppText>
      <View style={styles.actionRow}>
        <Pressable
          accessibilityHint="Opens ServiceLink on the web"
          accessibilityLabel={linkViewsPeriodAccessCopy.inlineAction}
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
          onPress={onWebSignInPress}
          style={({ pressed }) => [pressed && styles.actionPressed]}
        >
          <AppText includeFontPadding={false} style={styles.action}>
            {linkViewsPeriodAccessCopy.inlineAction}
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
