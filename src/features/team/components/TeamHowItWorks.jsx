import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { TEAM_HOW_IT_WORKS_LINK_LABEL } from '../constants/teamHowItWorksCopy';
import { TeamHowItWorksSheet } from './TeamHowItWorksSheet';

export function TeamHowItWorks() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const { colors } = useTheme();

  return (
    <>
      <Pressable
        accessibilityHint="Opens an explanation of how team works"
        accessibilityLabel={TEAM_HOW_IT_WORKS_LINK_LABEL}
        accessibilityRole="button"
        hitSlop={10}
        onPress={() => setSheetVisible(true)}
      >
        {({ pressed }) => (
          <View style={styles.linkHit}>
            <AppText
              style={[styles.link, { color: colors.textSecondary, opacity: pressed ? 0.7 : 1 }]}
            >
              {TEAM_HOW_IT_WORKS_LINK_LABEL}
            </AppText>
          </View>
        )}
      </Pressable>
      <TeamHowItWorksSheet visible={sheetVisible} onRequestClose={() => setSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  linkHit: {
    alignItems: 'center',
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
