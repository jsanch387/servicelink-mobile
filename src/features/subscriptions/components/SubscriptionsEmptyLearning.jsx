import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../theme';
import {
  SUBSCRIPTIONS_EMPTY_TITLE,
  SUBSCRIPTIONS_HOW_IT_WORKS_LINK_LABEL,
} from '../constants/subscriptionsHowItWorksCopy';
import { SubscriptionsHowItWorksSheet } from './SubscriptionsHowItWorksSheet';

/**
 * Empty subscriptions hub: centered title + How it works journey.
 */
export function SubscriptionsEmptyLearning() {
  const { colors } = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: 'center',
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingVertical: 48,
        },
        title: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          fontWeight: '700',
          letterSpacing: -0.2,
          textAlign: 'center',
        },
        linkHit: {
          marginTop: 14,
          paddingHorizontal: 8,
          paddingVertical: 6,
        },
        link: {
          color: colors.textSecondary,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 15,
          fontWeight: '600',
          textAlign: 'center',
          textDecorationLine: 'underline',
        },
      }),
    [colors],
  );

  return (
    <View style={styles.wrap}>
      <AppText style={styles.title}>{SUBSCRIPTIONS_EMPTY_TITLE}</AppText>
      <Pressable
        accessibilityHint="Opens a short guide to how subscriptions work"
        accessibilityLabel={SUBSCRIPTIONS_HOW_IT_WORKS_LINK_LABEL}
        accessibilityRole="button"
        hitSlop={10}
        style={styles.linkHit}
        onPress={() => setSheetOpen(true)}
      >
        <AppText style={styles.link}>{SUBSCRIPTIONS_HOW_IT_WORKS_LINK_LABEL}</AppText>
      </Pressable>
      <SubscriptionsHowItWorksSheet
        visible={sheetOpen}
        onRequestClose={() => setSheetOpen(false)}
      />
    </View>
  );
}
