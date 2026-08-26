import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, SpotlightCard } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';
import { formatCreatePaymentDollars } from '../utils/createPaymentAmount';

/** White recap card with a quiet edge, wash, and receipt rule. */
export function CreatePaymentLinkPreview({ amount, note, businessName }) {
  const { colors } = useTheme();
  const title = note?.trim() || 'Payment';
  const merchant = String(businessName ?? '').trim() || 'ServiceLink';
  const initial = merchant.slice(0, 1).toUpperCase();
  const lightFace = String(colors.nextUpSurface ?? '').toLowerCase() === '#ffffff';
  const chipBg = lightFace ? '#ececec' : 'rgba(255,255,255,0.10)';
  const markBg = lightFace ? '#0a0a0a' : '#fafafa';
  const markColor = lightFace ? '#ffffff' : '#0a0a0a';
  const rule = lightFace ? 'rgba(10,10,10,0.12)' : 'rgba(255,255,255,0.14)';
  const edge = lightFace ? 'rgba(10,10,10,0.08)' : 'rgba(255,255,255,0.10)';

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          borderColor: edge,
          borderWidth: StyleSheet.hairlineWidth,
          overflow: 'hidden',
          paddingHorizontal: 20,
          paddingVertical: 22,
        },
        wash: {
          ...StyleSheet.absoluteFillObject,
        },
        label: {
          color: colors.nextUpTextMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 12,
          letterSpacing: 0.6,
          textAlign: 'center',
          textTransform: 'uppercase',
        },
        rule: {
          alignSelf: 'center',
          backgroundColor: rule,
          borderRadius: 1,
          height: 2,
          marginTop: 10,
          width: 28,
        },
        amount: {
          color: colors.nextUpText,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 40,
          letterSpacing: -1.2,
          marginTop: 14,
          textAlign: 'center',
        },
        chip: {
          alignSelf: 'center',
          backgroundColor: chipBg,
          borderRadius: 999,
          marginTop: 14,
          maxWidth: '100%',
          paddingHorizontal: 14,
          paddingVertical: 8,
        },
        chipText: {
          color: colors.nextUpText,
          fontFamily: FONT_FAMILIES.medium,
          fontSize: 15,
          letterSpacing: -0.2,
        },
        divider: {
          alignSelf: 'stretch',
          backgroundColor: rule,
          height: StyleSheet.hairlineWidth,
          marginHorizontal: 8,
          marginTop: 20,
        },
        merchantRow: {
          alignItems: 'center',
          alignSelf: 'center',
          flexDirection: 'row',
          marginTop: 14,
        },
        mark: {
          alignItems: 'center',
          backgroundColor: markBg,
          borderRadius: 12,
          height: 24,
          justifyContent: 'center',
          marginRight: 8,
          width: 24,
        },
        markText: {
          color: markColor,
          fontFamily: FONT_FAMILIES.bold,
          fontSize: 11,
        },
        merchant: {
          color: colors.nextUpTextMuted,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 13,
        },
      }),
    [chipBg, colors, edge, markBg, markColor, rule],
  );

  return (
    <SpotlightCard
      accessibilityLabel={`Payment preview, ${formatCreatePaymentDollars(amount)}, ${title}`}
      style={styles.card}
    >
      <LinearGradient
        colors={
          lightFace
            ? ['rgba(255,255,255,0)', 'rgba(10,10,10,0.045)']
            : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']
        }
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
        start={{ x: 0.5, y: 0 }}
        style={styles.wash}
      />
      <AppText style={styles.label}>Payment</AppText>
      <View style={styles.rule} />
      <AppText style={styles.amount}>{formatCreatePaymentDollars(amount)}</AppText>
      <View style={styles.chip}>
        <AppText numberOfLines={1} style={styles.chipText}>
          {title}
        </AppText>
      </View>
      <View style={styles.divider} />
      <View style={styles.merchantRow}>
        <View style={styles.mark}>
          <AppText style={styles.markText}>{initial}</AppText>
        </View>
        <View>
          <AppText numberOfLines={1} style={styles.merchant}>
            {merchant}
          </AppText>
        </View>
      </View>
    </SpotlightCard>
  );
}
