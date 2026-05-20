import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import { quotesAcceptRequestsAccessCopy } from '../constants/quotesAccessCopy';

/**
 * Trailing web sign-in action when quote requests require account changes on web.
 *
 * @param {{ onWebSignInPress: () => void }} props
 */
export function QuotesProInlineUpsell({ onWebSignInPress }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          alignSelf: 'stretch',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingBottom: 0,
          paddingTop: 10,
        },
        cta: {
          color: colors.link,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
          fontWeight: '600',
          letterSpacing: -0.1,
          lineHeight: 17,
          paddingVertical: 0,
        },
        ctaPressed: {
          opacity: 0.72,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityHint="Opens ServiceLink on the web"
        accessibilityLabel={quotesAcceptRequestsAccessCopy.inlineAction}
        accessibilityRole="button"
        hitSlop={{ top: 10, bottom: 10, left: 12, right: 12 }}
        style={({ pressed }) => [pressed && styles.ctaPressed]}
        onPress={onWebSignInPress}
      >
        <AppText includeFontPadding={false} style={styles.cta}>
          {quotesAcceptRequestsAccessCopy.inlineAction}
        </AppText>
      </Pressable>
    </View>
  );
}
