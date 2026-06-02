import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, BottomSheetModal, Button } from '../../../components/ui';
import { useTheme } from '../../../theme';
import {
  REVIEWS_HOW_IT_WORKS_BULLETS,
  REVIEWS_HOW_IT_WORKS_DISMISS_LABEL,
  REVIEWS_HOW_IT_WORKS_INTRO,
  REVIEWS_HOW_IT_WORKS_TITLE,
} from '../constants';

/**
 * @param {{ visible: boolean; onRequestClose: () => void }} props
 */
export function ReviewsHowItWorksSheet({ visible, onRequestClose }) {
  const { colors } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        intro: {
          color: colors.textSecondary,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        bullets: {
          gap: 12,
          marginTop: 18,
        },
        bulletRow: {
          flexDirection: 'row',
          gap: 10,
        },
        bullet: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
        },
        bulletText: {
          color: colors.textMuted,
          flex: 1,
          fontSize: 15,
          fontWeight: '500',
          lineHeight: 22,
        },
        footer: {
          marginTop: 20,
        },
      }),
    [colors],
  );

  return (
    <BottomSheetModal
      footer={
        <View style={styles.footer}>
          <Button
            fullWidth
            title={REVIEWS_HOW_IT_WORKS_DISMISS_LABEL}
            variant="secondary"
            onPress={onRequestClose}
          />
        </View>
      }
      sheetHeightPercent={46}
      title={REVIEWS_HOW_IT_WORKS_TITLE}
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <AppText style={styles.intro}>{REVIEWS_HOW_IT_WORKS_INTRO}</AppText>
      <View style={styles.bullets}>
        {REVIEWS_HOW_IT_WORKS_BULLETS.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <AppText style={styles.bullet}>·</AppText>
            <AppText style={styles.bulletText}>{line}</AppText>
          </View>
        ))}
      </View>
    </BottomSheetModal>
  );
}
