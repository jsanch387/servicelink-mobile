import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button } from '../../../../components/ui';
import { useTheme } from '../../../../theme';
import {
  COMPLETE_VISIT_RECEIPT_EMAIL_ADD_LINK,
  COMPLETE_VISIT_RECEIPT_EMAIL_CTA_DETAIL,
  COMPLETE_VISIT_RECEIPT_EMAIL_NEEDED,
} from '../constants/completeVisitReceiptEmailCopy';

/**
 * Tap to Pay receipt email prompt — sits below the Payment card.
 *
 * @param {{ onPressAddEmail: () => void }} props
 */
export function CompleteVisitReceiptEmailNotice({ onPressAddEmail }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.cardSurface,
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : colors.border,
          borderRadius: 14,
          borderWidth: 1,
          gap: 8,
          marginTop: -6,
          paddingHorizontal: 12,
          paddingVertical: 11,
        },
        headerRow: {
          alignItems: 'center',
          columnGap: 8,
          flexDirection: 'row',
        },
        iconWrap: {
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.shell,
          borderRadius: 8,
          height: 30,
          justifyContent: 'center',
          width: 30,
        },
        textWrap: {
          flex: 1,
          gap: 1,
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontSize: 14,
          fontWeight: '700',
          letterSpacing: -0.1,
          lineHeight: 18,
        },
        detail: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '500',
          lineHeight: 14,
        },
      }),
    [colors, isDark],
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.textMuted} name="mail-outline" size={16} />
        </View>
        <View style={styles.textWrap}>
          <AppText style={styles.title}>{COMPLETE_VISIT_RECEIPT_EMAIL_NEEDED}</AppText>
          <AppText style={styles.detail}>{COMPLETE_VISIT_RECEIPT_EMAIL_CTA_DETAIL}</AppText>
        </View>
      </View>
      <Button
        fullWidth
        title={COMPLETE_VISIT_RECEIPT_EMAIL_ADD_LINK}
        variant="secondary"
        onPress={onPressAddEmail}
      />
    </View>
  );
}
