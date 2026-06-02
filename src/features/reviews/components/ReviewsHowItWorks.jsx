import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { REVIEWS_HOW_IT_WORKS_TITLE } from '../constants';
import { ReviewsHowItWorksSheet } from './ReviewsHowItWorksSheet';

export function ReviewsHowItWorks() {
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: {
          alignItems: 'center',
          backgroundColor: colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 12,
          paddingVertical: 11,
        },
        label: {
          color: colors.textSecondary,
          flex: 1,
          fontSize: 14,
          fontWeight: '600',
          letterSpacing: -0.1,
        },
      }),
    [colors],
  );

  return (
    <>
      <Pressable
        accessibilityHint="Opens more information about reviews"
        accessibilityRole="button"
        onPress={() => setSheetVisible(true)}
        style={styles.press}
      >
        <Ionicons color={colors.textMuted} name="information-circle-outline" size={20} />
        <AppText style={styles.label}>{REVIEWS_HOW_IT_WORKS_TITLE}</AppText>
        <Ionicons color={colors.textMuted} name="chevron-forward" size={18} />
      </Pressable>
      <ReviewsHowItWorksSheet
        visible={sheetVisible}
        onRequestClose={() => setSheetVisible(false)}
      />
    </>
  );
}
