import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { MARKETING_HOW_IT_WORKS_LINK_LABEL } from '../constants/marketingHowItWorksCopy';
import { MarketingHowItWorksSheet } from './MarketingHowItWorksSheet';

/**
 * @param {{ isPromosTab: boolean }} props
 */
export function MarketingHowItWorks({ isPromosTab }) {
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        link: {
          marginTop: 16,
          paddingHorizontal: 8,
          paddingVertical: 6,
        },
        linkText: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '600',
          textAlign: 'center',
          textDecorationLine: 'underline',
        },
      }),
    [colors],
  );

  return (
    <>
      <Pressable
        accessibilityHint={
          isPromosTab
            ? 'Opens an explanation of how promo codes work'
            : 'Opens an explanation of how sales work'
        }
        accessibilityRole="button"
        style={styles.link}
        onPress={() => setSheetVisible(true)}
      >
        <AppText style={styles.linkText}>{MARKETING_HOW_IT_WORKS_LINK_LABEL}</AppText>
      </Pressable>
      <MarketingHowItWorksSheet
        isPromosTab={isPromosTab}
        visible={sheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </>
  );
}
