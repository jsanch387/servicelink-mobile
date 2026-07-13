import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
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
 * Center-screen reveal after saving a promo code.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {import('../utils/marketingCampaignModel').MarketingCampaign | null} props.promo
 * @param {() => void} props.onDone
 * @param {(promo: import('../utils/marketingCampaignModel').MarketingCampaign) => void} [props.onShare]
 */
export function PromoCodeSuccessModal({ visible, promo, onDone, onShare }) {
  const { colors, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.88)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.6)).current;

  const code = String(promo?.code ?? '').trim();
  const discountLabel = promo ? formatMarketingDiscountLabel(promo) : '';
  const dateRange = promo
    ? formatMarketingDateRangeShort(promo.startDateYyyyMmDd, promo.endDateYyyyMmDd)
    : '';

  // Wider card with ~20px minimum inset from screen edges.
  const cardWidth = Math.min(windowWidth - 40, 380);

  useEffect(() => {
    if (visible && promo) {
      setMounted(true);
      setCopied(false);
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
  }, [visible, promo, mounted, backdropOpacity, cardOpacity, cardScale]);

  useEffect(() => {
    if (!mounted || !visible || !promo) return undefined;

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
  }, [mounted, visible, promo?.id, backdropOpacity, cardScale, cardOpacity, iconScale, promo]);

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
          paddingBottom: 18,
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
        ticket: {
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
        ticketLabel: {
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        },
        code: {
          color: colors.text,
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
          fontSize: 32,
          fontWeight: '800',
          letterSpacing: 4,
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
        actions: {
          gap: 10,
        },
        copyBtn: {
          alignItems: 'center',
          backgroundColor: colors.text,
          borderRadius: 12,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          paddingVertical: 14,
        },
        copyBtnDone: {
          backgroundColor: isDark ? 'rgba(110,231,183,0.18)' : 'rgba(4,120,87,0.12)',
        },
        copyLabel: {
          color: colors.surface,
          fontSize: 15,
          fontWeight: '700',
        },
        copyLabelDone: {
          color: colors.textSuccess,
        },
        shareBtn: {
          alignItems: 'center',
          backgroundColor: isDark ? colors.shellElevated : colors.shell,
          borderColor: colors.borderStrong,
          borderRadius: 12,
          borderWidth: 1,
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          paddingVertical: 14,
        },
        shareLabel: {
          color: colors.text,
          fontSize: 15,
          fontWeight: '700',
        },
      }),
    [cardWidth, colors, isDark],
  );

  const handleCopy = useCallback(async () => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [code]);

  const handleClose = useCallback(() => {
    onDone();
  }, [onDone]);

  const handleShare = useCallback(() => {
    if (!promo || !onShare) return;
    onShare(promo);
  }, [onShare, promo]);

  if (!mounted || !promo) return null;

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
              <Ionicons color={SUBMIT_OUTCOME_SUCCESS.color} name="ticket" size={22} />
            </Animated.View>
            <AppText style={styles.title}>Code created</AppText>
            <AppText style={styles.subtitle}>Copy it and share anywhere customers book.</AppText>
          </View>

          <View style={styles.ticket}>
            <AppText style={styles.ticketLabel}>Your code</AppText>
            <AppText selectable style={styles.code}>
              {code}
            </AppText>
            {discountLabel ? (
              <View style={styles.discountPill}>
                <AppText style={styles.discount}>{discountLabel}</AppText>
              </View>
            ) : null}
            {dateRange ? <AppText style={styles.dates}>{dateRange}</AppText> : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={copied ? 'Code copied' : 'Copy promo code'}
              accessibilityRole="button"
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
              onPress={() => {
                void handleCopy();
              }}
            >
              <Ionicons
                color={copied ? colors.textSuccess : colors.surface}
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
              />
              <AppText style={[styles.copyLabel, copied && styles.copyLabelDone]}>
                {copied ? 'Copied!' : 'Copy code'}
              </AppText>
            </Pressable>
            {onShare ? (
              <Pressable
                accessibilityLabel="Share"
                accessibilityRole="button"
                style={styles.shareBtn}
                onPress={handleShare}
              >
                <Ionicons color={colors.text} name="share-social-outline" size={18} />
                <AppText style={styles.shareLabel}>Share</AppText>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
