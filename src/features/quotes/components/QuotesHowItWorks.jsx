import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { QUOTES_HOW_IT_WORKS_LINK_LABEL } from '../constants/quotesHowItWorksCopy';
import { QuotesHowItWorksSheet } from './QuotesHowItWorksSheet';

export function QuotesHowItWorks() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <>
      <Pressable
        accessibilityHint="Opens an explanation of how quotes work"
        accessibilityLabel={QUOTES_HOW_IT_WORKS_LINK_LABEL}
        accessibilityRole="button"
        hitSlop={10}
        style={styles.linkHit}
        onPress={() => setSheetVisible(true)}
      >
        <AppText style={[styles.link, { color: colors.textSecondary }]}>
          {QUOTES_HOW_IT_WORKS_LINK_LABEL}
        </AppText>
      </Pressable>
      <QuotesHowItWorksSheet visible={sheetVisible} onRequestClose={() => setSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  linkHit: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
