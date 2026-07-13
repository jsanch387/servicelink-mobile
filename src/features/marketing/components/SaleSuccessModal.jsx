import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppText } from '../../../components/ui';
import { SUBMIT_OUTCOME_SUCCESS } from '../../../components/ui/submitOutcomeTokens';
import { useTheme } from '../../../theme';
import {
  formatMarketingDateRangeShort,
  formatMarketingDiscountLabel,
} from '../utils/marketingCampaignModel';

/**
 * Center-screen reveal after saving a sale.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign | null} props.sale
 * @param {() => void} props.onDone
 * @param {(sale: import('../utils/marketingCampaignModel').MarketingCampaign) => void} [props.onShare]
 */
export function SaleSuccessModal({ visible, sale, onDone, onShare }) {
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.6)).current;

  const name = String(sale?.name ?? '').trim();
  const discountLabel = sale ? formatMarketingDiscountLabel(sale) : '';
  const dateRange = sale
    ? formatMarketingDateRangeShort(sale.startDateYyyyMmDd, sale.endDateYyyyMmDd)
    : '';

  const cardWidth = Math.min(windowWidth - 40, 380);

  useEffect(() => {
    if (visible && sale) {
      setMounted(true);
      return undefined;
    }

    if (!mounted) return undefined;

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.94,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false);
    });

    return undefined;
  }, [visible, sale, mounted, backdropOpacity, cardOpacity, cardScale]);

  useEffect(() => {
    if (!mounted || !visible || !sale) return undefined;

    backdropOpacity.setValue(0);
    cardScale.setValue(0.88);
    cardOpacity.setValue(0);
    iconScale.setValue(0.6);

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.sequence([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    return undefined;
  }, [mounted, visible, sale?.id, backdropOpacity, cardScale, cardOpacity, iconScale, sale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          alignItems: 'center',
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
        },
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.48)',
        },
        card: {
          backgroundColor: isDark ? colors.cardSurface : colors.surface,
          borderColor: colors.border,
          borderRadius: 24,
          borderWidth: 1,
          elevation: 12,
          gap: 14,
          paddingBottom: 20,
          paddingHorizontal: 20,
          paddingTop: 18,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.35 : 0.16,
          shadowRadius: 24,
          width: cardWidth,
          zIndex: 2,
        },
        closeHit: {
          alignItems: 'center',
          height: 32,
          justifyContent: 'center',
          position: 'absolute',
          right: 14,
          top: 14,
          width: 32,
          zIndex: 3,
        },
        header: {
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 8,
          paddingTop: 2,
        },
        iconRing: {
          alignItems: 'center',
          backgroundColor: SUBMIT_OUTCOME_SUCCESS.ring,
          borderRadius: 999,
          height: 48,
          justifyContent: 'center',
          width: 48,
        },
        title: {
          color: colors.text,
          fontSize: 20,
          fontWeight: '800',
          letterSpacing: -0.35,
          textAlign: 'center',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          lineHeight: 18,
          textAlign: 'center',
        },
        summary: {
          alignItems: 'center',
          backgroundColor: isDark ? colors.shell : colors.shellElevated,
          borderColor: colors.border,
          borderRadius: 16,
          borderStyle: 'dashed',
          borderWidth: 1.5,
          gap: 8,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        summaryLabel: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        },
        saleName: {
          color: colors.text,
          fontSize: 24,
          fontWeight: '800',
          letterSpacing: -0.3,
          textAlign: 'center',
        },
        discountPill: {
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surface,
          borderColor: colors.borderStrong,
          borderRadius: 999,
          borderWidth: 1,
          paddingHorizontal: 14,
          paddingVertical: 6,
        },
        discount: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '800',
          letterSpacing: -0.2,
        },
        dates: {
          color: colors.textMuted,
          fontSize: 13,
          fontWeight: '500',
          textAlign: 'center',
        },
        shareBtn: {
          alignItems: 'center',
          backgroundColor: colors.text,
          borderRadius: 12,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          paddingVertical: 14,
        },
        shareLabel: {
          color: colors.surface,
          fontSize: 15,
          fontWeight: '700',
        },
      }),
    [cardWidth, colors, isDark],
  );

  const handleClose = useCallback(() => {
    onDone();
  }, [onDone]);

  const handleShare = useCallback(() => {
    if (!sale || !onShare) return;
    onShare(sale);
  }, [onShare, sale]);

  if (!mounted || !sale) return null;

  return (
    <Modal animationType="none" transparent visible={mounted} onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
        </Pressable>

        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
            style={styles.closeHit}
            onPress={handleClose}
          >
            <Ionicons color={colors.textMuted} name="close" size={22} />
          </Pressable>

          <View style={styles.header}>
            <Animated.View style={[styles.iconRing, { transform: [{ scale: iconScale }] }]}>
              <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="megaphone" size={22} />
            </Animated.View>
            <AppText style={styles.title}>Sale created</AppText>
            <AppText style={styles.subtitle}>
              Customers see this discount on your booking link during these dates.
            </AppText>
          </View>

          <View style={styles.summary}>
            <AppText style={styles.summaryLabel}>Your sale</AppText>
            {name ? (
              <AppText selectable style={styles.saleName}>
                {name}
              </AppText>
            ) : null}
            {discountLabel ? (
              <View style={styles.discountPill}>
                <AppText style={styles.discount}>{discountLabel}</AppText>
              </View>
            ) : null}
            {dateRange ? <AppText style={styles.dates}>{dateRange}</AppText> : null}
          </View>

          {onShare ? (
            <Pressable
              accessibilityLabel="Share"
              accessibilityRole="button"
              style={styles.shareBtn}
              onPress={handleShare}
            >
              <Ionicons color={colors.surface} name="share-social-outline" size={18} />
              <AppText style={styles.shareLabel}>Share</AppText>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}
