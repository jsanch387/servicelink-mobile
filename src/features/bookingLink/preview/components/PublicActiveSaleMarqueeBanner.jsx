import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatSaleDiscountHighlight } from '../utils/mapSaleToMarqueeBanner';

const SEGMENT_COUNT = 6;
/** Matches web `animate-marquee-premium`. */
const MARQUEE_MS = 32000;

function MarqueeAnnouncement({ saleName, discountEmphasis }) {
  return (
    <View style={styles.announcement}>
      <Text style={styles.saleName}>{saleName}</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={styles.discount}>{discountEmphasis}</Text>
    </View>
  );
}

function MarqueeSeparator() {
  return <Text style={styles.separator}>✦</Text>;
}

/**
 * Auto-scrolling sale strip shown above the booking-link cover (matches web public banner).
 *
 * @param {{
 *   sale: { name: string; discountType: 'percentage' | 'fixed'; discountValue: number };
 *   offLabel?: string;
 * }} props
 */
export function PublicActiveSaleMarqueeBanner({ sale, offLabel = 'off' }) {
  const highlight = formatSaleDiscountHighlight(sale.discountType, sale.discountValue);
  const translateX = useRef(new Animated.Value(0)).current;
  const [contentWidth, setContentWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const discountEmphasis = useMemo(() => {
    if (!highlight) return '';
    return `${highlight} ${offLabel}`.toUpperCase();
  }, [highlight, offLabel]);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(Boolean(enabled));
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || contentWidth <= 0) return undefined;

    translateX.setValue(0);
    const loop = Animated.loop(
      Animated.timing(translateX, {
        toValue: -contentWidth / 2,
        duration: MARQUEE_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [contentWidth, reduceMotion, translateX, discountEmphasis, sale.name]);

  if (!highlight) return null;

  const segment = (
    <>
      <MarqueeAnnouncement discountEmphasis={discountEmphasis} saleName={sale.name} />
      <MarqueeSeparator />
    </>
  );

  const ariaLabel = `Sale: ${sale.name}, ${highlight} ${offLabel}`;

  if (reduceMotion) {
    return (
      <View accessibilityLabel={ariaLabel} accessibilityRole="text" style={styles.strip}>
        <View style={styles.staticCenter}>
          <MarqueeAnnouncement discountEmphasis={discountEmphasis} saleName={sale.name} />
        </View>
      </View>
    );
  }

  return (
    <View accessibilityLabel={ariaLabel} accessibilityRole="text" style={styles.strip}>
      <Animated.View
        style={[styles.marqueeRow, { transform: [{ translateX }] }]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && w !== contentWidth) setContentWidth(w);
        }}
      >
        {Array.from({ length: SEGMENT_COUNT * 2 }).map((_, i) => (
          <Fragment key={i}>{segment}</Fragment>
        ))}
      </Animated.View>

      <LinearGradient
        colors={['#FAFAFA', 'rgba(250,250,250,0)']}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={styles.fadeLeft}
      />
      <LinearGradient
        colors={['rgba(250,250,250,0)', '#FAFAFA']}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={styles.fadeRight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    backgroundColor: '#FAFAFA',
    borderBottomColor: 'rgba(212, 212, 216, 0.4)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 1,
    overflow: 'hidden',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 0,
  },
  staticCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  marqueeRow: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
  },
  announcement: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saleName: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    color: 'rgba(0,0,0,0.3)',
    fontSize: 12,
  },
  discount: {
    color: '#000',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.28,
    textTransform: 'uppercase',
  },
  separator: {
    color: 'rgba(0,0,0,0.4)',
    fontSize: 10,
    paddingHorizontal: 16,
  },
  fadeLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 40,
  },
  fadeRight: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 40,
  },
});
