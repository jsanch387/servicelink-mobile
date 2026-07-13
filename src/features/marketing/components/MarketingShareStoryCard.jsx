import { LinearGradient } from 'expo-linear-gradient';
import { forwardRef, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { MARKETING_CAMPAIGN_KIND } from '../constants';
import {
  campaignHasDateRange,
  formatMarketingDateRangeShort,
  formatMarketingDiscountLabel,
} from '../utils/marketingCampaignModel';

/** Preview aspect ratio matches Instagram Stories (9:16). */
export const MARKETING_STORY_ASPECT = 9 / 16;

/**
 * @param {string} text
 * @param {number} scale
 */
function promoCodeTypeScale(text, scale) {
  const len = String(text ?? '').trim().length;
  if (len > 16) {
    return { fontSize: 22 * scale, letterSpacing: 1.2 * scale };
  }
  if (len > 12) {
    return { fontSize: 26 * scale, letterSpacing: 2 * scale };
  }
  if (len > 8) {
    return { fontSize: 30 * scale, letterSpacing: 2.8 * scale };
  }
  return { fontSize: 36 * scale, letterSpacing: 4 * scale };
}

/**
 * @param {string} text
 * @param {number} scale
 */
function saleNameTypeScale(text, scale) {
  const len = String(text ?? '').trim().length;
  if (len > 36) {
    return { fontSize: 20 * scale, letterSpacing: -0.2 * scale };
  }
  if (len > 22) {
    return { fontSize: 24 * scale, letterSpacing: -0.3 * scale };
  }
  return { fontSize: 28 * scale, letterSpacing: -0.5 * scale };
}

/**
 * Shareable story graphic for a promo code or sale.
 * Capture at 1080×1920 via `react-native-view-shot` (see capture helpers).
 *
 * @param {object} props
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign} props.campaign
 * @param {string} props.businessName
 * @param {string} [props.bookingLinkDisplay]
 * @param {number} props.width — layout width; height is derived from 9:16
 */
export const MarketingShareStoryCard = forwardRef(function MarketingShareStoryCard(
  { campaign, businessName, bookingLinkDisplay = '', width },
  ref,
) {
  const height = Math.round(width / MARKETING_STORY_ASPECT);
  const isPromo = campaign.kind === MARKETING_CAMPAIGN_KIND.PROMO_CODE;
  const discountLabel = formatMarketingDiscountLabel(campaign);
  const headline = isPromo
    ? String(campaign.code ?? '').trim()
    : String(campaign.name ?? '').trim();
  const dateRange = campaignHasDateRange(campaign)
    ? formatMarketingDateRangeShort(campaign.startDateYyyyMmDd, campaign.endDateYyyyMmDd)
    : '';
  const linkText = String(bookingLinkDisplay ?? '').trim() || 'myservicelink.app';
  const businessLabel = String(businessName ?? '').trim() || 'Your business';

  const styles = useMemo(() => {
    const scale = width / 360;
    const codeType = promoCodeTypeScale(headline, scale);
    const saleType = saleNameTypeScale(headline, scale);
    const longBusiness = businessLabel.length > 28;

    return StyleSheet.create({
      root: {
        backgroundColor: '#0a0a0a',
        height,
        overflow: 'hidden',
        width,
      },
      fill: {
        ...StyleSheet.absoluteFillObject,
      },
      content: {
        flex: 1,
        justifyContent: 'center',
        paddingBottom: 48 * scale,
        paddingHorizontal: 32 * scale,
        paddingTop: 48 * scale,
      },
      topBlock: {
        gap: 12 * scale,
        left: 32 * scale,
        position: 'absolute',
        right: 32 * scale,
        top: 48 * scale,
      },
      businessName: {
        color: 'rgba(250,250,250,0.68)',
        fontSize: longBusiness ? 11 * scale : 12 * scale,
        fontWeight: '700',
        letterSpacing: longBusiness ? 1 * scale : 2 * scale,
        textTransform: 'uppercase',
      },
      accentRule: {
        backgroundColor: '#fafafa',
        borderRadius: 999,
        height: 2 * scale,
        width: 28 * scale,
      },
      middleBlock: {
        alignItems: 'center',
        gap: 16 * scale,
        maxWidth: '100%',
        width: '100%',
      },
      eyebrow: {
        color: 'rgba(250,250,250,0.55)',
        fontSize: 11 * scale,
        fontWeight: '700',
        letterSpacing: 2.8 * scale,
        textTransform: 'uppercase',
      },
      discount: {
        color: '#fafafa',
        fontSize: 68 * scale,
        fontWeight: '800',
        letterSpacing: -2.2 * scale,
        textAlign: 'center',
        width: '100%',
      },
      codeBlock: {
        alignItems: 'center',
        alignSelf: 'stretch',
        borderColor: 'rgba(255,255,255,0.16)',
        borderRadius: 16 * scale,
        borderWidth: 1,
        gap: 10 * scale,
        paddingHorizontal: 16 * scale,
        paddingVertical: 18 * scale,
      },
      codeLabel: {
        color: 'rgba(250,250,250,0.5)',
        fontSize: 11 * scale,
        fontWeight: '700',
        letterSpacing: 1.8 * scale,
        textTransform: 'uppercase',
      },
      code: {
        color: '#fafafa',
        fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
        fontSize: codeType.fontSize,
        fontWeight: '800',
        letterSpacing: codeType.letterSpacing,
        textAlign: 'center',
        width: '100%',
      },
      saleName: {
        color: '#fafafa',
        fontSize: saleType.fontSize,
        fontWeight: '800',
        letterSpacing: saleType.letterSpacing,
        textAlign: 'center',
        width: '100%',
      },
      dates: {
        color: 'rgba(250,250,250,0.55)',
        fontSize: 13 * scale,
        fontWeight: '600',
        letterSpacing: 0.15 * scale,
        textAlign: 'center',
        width: '100%',
      },
      bookBlock: {
        alignItems: 'center',
        bottom: 40 * scale,
        gap: 6 * scale,
        left: 32 * scale,
        position: 'absolute',
        right: 32 * scale,
      },
      bookDivider: {
        backgroundColor: 'rgba(255,255,255,0.14)',
        height: StyleSheet.hairlineWidth,
        marginBottom: 10 * scale,
        width: 36 * scale,
      },
      bookLabel: {
        color: 'rgba(250,250,250,0.4)',
        fontSize: 10 * scale,
        fontWeight: '700',
        letterSpacing: 1.6 * scale,
        textTransform: 'uppercase',
      },
      linkValue: {
        color: 'rgba(250,250,250,0.62)',
        fontSize: 12 * scale,
        fontWeight: '600',
        letterSpacing: 0.1 * scale,
        textAlign: 'center',
        width: '100%',
      },
    });
  }, [businessLabel, headline, height, width]);

  return (
    <View ref={ref} collapsable={false} style={styles.root}>
      <LinearGradient
        colors={['#141414', '#0a0a0a', '#070707']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={styles.fill}
      />

      <View style={styles.topBlock}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          numberOfLines={2}
          style={styles.businessName}
        >
          {businessLabel}
        </AppText>
        <View style={styles.accentRule} />
      </View>

      <View style={styles.content}>
        <View style={styles.middleBlock}>
          <AppText style={styles.eyebrow}>Limited time offer</AppText>
          <AppText
            adjustsFontSizeToFit
            minimumFontScale={0.55}
            numberOfLines={1}
            style={styles.discount}
          >
            {discountLabel}
          </AppText>

          {headline ? (
            isPromo ? (
              <View style={styles.codeBlock}>
                <AppText style={styles.codeLabel}>Use code</AppText>
                <AppText
                  adjustsFontSizeToFit
                  minimumFontScale={0.55}
                  numberOfLines={2}
                  style={styles.code}
                >
                  {headline}
                </AppText>
              </View>
            ) : (
              <AppText
                adjustsFontSizeToFit
                minimumFontScale={0.65}
                numberOfLines={3}
                style={styles.saleName}
              >
                {headline}
              </AppText>
            )
          ) : null}

          {dateRange ? (
            <AppText numberOfLines={2} style={styles.dates}>
              {dateRange}
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.bookBlock}>
        <View style={styles.bookDivider} />
        <AppText style={styles.bookLabel}>Book at</AppText>
        <AppText numberOfLines={2} style={styles.linkValue}>
          {linkText}
        </AppText>
      </View>
    </View>
  );
});
