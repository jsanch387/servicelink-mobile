import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, DetailsSectionCard, Divider, LabelValueRow } from '../../../../components/ui';
import { FONT_FAMILIES, useTheme } from '../../../../theme';

/**
 * @typedef {'neutral' | 'success' | 'accent' | 'muted'} PaymentBannerTone
 */

/**
 * @param {import('../../../../theme/themes').ThemeColors} colors
 * @param {boolean} isDark
 * @param {PaymentBannerTone} tone
 */
function bannerAccentColor(colors, isDark, tone) {
  if (tone === 'success') return colors.textSuccess;
  if (tone === 'accent') return colors.accent;
  if (tone === 'muted') return colors.textMuted;
  return colors.accentMuted;
}

/**
 * @param {import('../../../../theme/themes').ThemeColors} colors
 * @param {boolean} isDark
 * @param {PaymentBannerTone} tone
 */
function iconWellBackground(colors, isDark, tone) {
  if (tone === 'success') {
    return isDark ? 'rgba(110,231,183,0.14)' : 'rgba(4,120,87,0.10)';
  }
  if (tone === 'accent') {
    return isDark ? 'rgba(250,250,250,0.08)' : 'rgba(10,10,10,0.06)';
  }
  if (tone === 'muted') {
    return isDark ? 'rgba(163,163,163,0.12)' : 'rgba(115,115,115,0.10)';
  }
  return isDark ? 'rgba(163,163,163,0.12)' : 'rgba(115,115,115,0.10)';
}

/**
 * Rich payment summary for booking details.
 *
 * @param {object} props
 * @param {object} props.payment — output of {@link buildBookingPaymentSection}
 */
export function BookingPaymentSection({ payment }) {
  const { colors, isDark } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        banner: {
          borderRadius: 12,
          flexDirection: 'row',
          gap: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
        },
        iconWell: {
          alignItems: 'center',
          borderRadius: 22,
          height: 44,
          justifyContent: 'center',
          width: 44,
        },
        textCol: {
          flex: 1,
          gap: 6,
          justifyContent: 'center',
          minWidth: 0,
        },
        title: {
          color: colors.text,
          fontFamily: FONT_FAMILIES.semibold,
          fontSize: 17,
          fontWeight: '600',
          letterSpacing: -0.25,
          lineHeight: 22,
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '400',
          lineHeight: 20,
        },
        dividerWrap: {
          marginBottom: 4,
          marginTop: 4,
        },
        linesWrap: {
          rowGap: 0,
        },
      }),
    [colors],
  );

  if (!payment?.visible || !payment.banner) {
    return null;
  }

  const { banner, lines } = payment;
  const accent = bannerAccentColor(colors, isDark, banner.tone);
  const wellBg = iconWellBackground(colors, isDark, banner.tone);

  return (
    <DetailsSectionCard bodyPadding="roomy" title="Payment">
      <View
        style={[
          styles.banner,
          {
            backgroundColor: 'transparent',
            borderLeftColor: accent,
            borderLeftWidth: 3,
          },
        ]}
      >
        <View style={[styles.iconWell, { backgroundColor: wellBg }]}>
          <Ionicons color={accent} name={banner.icon} size={22} />
        </View>
        <View style={styles.textCol}>
          <AppText style={styles.title}>{banner.title}</AppText>
          {banner.subtitle ? <AppText style={styles.subtitle}>{banner.subtitle}</AppText> : null}
        </View>
      </View>

      {lines?.length ? (
        <>
          <View style={styles.dividerWrap}>
            <Divider />
          </View>
          <View style={styles.linesWrap}>
            {lines.map((line, index) => (
              <LabelValueRow
                key={line.key}
                emphasize={Boolean(line.emphasize)}
                label={line.label}
                labelAppearance="caption"
                noTopMargin={index === 0}
                value={line.value}
              />
            ))}
          </View>
        </>
      ) : null}
    </DetailsSectionCard>
  );
}
