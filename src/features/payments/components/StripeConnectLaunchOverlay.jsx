import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, SurfaceCard } from '../../../components/ui';
import { useTheme } from '../../../theme';

const enableMotion = typeof process !== 'undefined' && process.env.NODE_ENV !== 'test';

/**
 * Full-screen progress while Stripe Connect onboarding is starting (API + handoff).
 * Modal keeps the experience above tabs and blocks duplicate actions.
 */
export function StripeConnectLaunchOverlay({ visible }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [trackWidth, setTrackWidth] = useState(0);
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible || !enableMotion || trackWidth < 24) {
      return undefined;
    }
    const pillW = Math.max(52, trackWidth * 0.34);
    const maxTx = Math.max(0, trackWidth - pillW);
    slide.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(slide, {
          toValue: maxTx,
          duration: 880,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 0,
          duration: 880,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [visible, slide, trackWidth]);

  if (!visible) {
    return null;
  }

  const pillW = trackWidth > 0 ? Math.max(52, trackWidth * 0.34) : 52;

  return (
    <Modal accessibilityViewIsModal animationType="fade" statusBarTranslucent transparent visible>
      <View
        accessibilityLabel="Connecting to Stripe"
        accessibilityRole="progressbar"
        style={[styles.root, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.backdrop} />
        <View
          pointerEvents="box-none"
          style={[
            styles.centerWrap,
            { paddingBottom: Math.max(insets.bottom, 20), paddingHorizontal: 22 },
          ]}
        >
          <SurfaceCard outlined padding="md" style={styles.card}>
            <View
              style={[
                styles.iconRing,
                { backgroundColor: colors.border, borderColor: colors.border },
              ]}
            >
              <Ionicons color={colors.accent} name="shield-checkmark" size={26} />
            </View>
            <AppText style={[styles.title, { color: colors.text }]}>Connecting securely</AppText>
            <AppText style={[styles.body, { color: colors.textMuted }]}>
              Preparing your Stripe session. You will continue in your browser in a moment.
            </AppText>
            <View
              style={[styles.track, { backgroundColor: colors.border }]}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w > 0) setTrackWidth(w);
              }}
            >
              {trackWidth > 0 ? (
                <Animated.View
                  style={[
                    styles.pill,
                    {
                      backgroundColor: colors.accent,
                      transform: [{ translateX: slide }],
                      width: pillW,
                    },
                  ]}
                />
              ) : null}
            </View>
          </SurfaceCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 7, 10, 0.55)',
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    alignSelf: 'center',
    gap: 14,
    maxWidth: 400,
    width: '100%',
  },
  iconRing: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.35,
    lineHeight: 24,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    textAlign: 'center',
  },
  track: {
    borderRadius: 999,
    height: 5,
    marginTop: 4,
    overflow: 'hidden',
    width: '100%',
  },
  pill: {
    borderRadius: 999,
    height: 5,
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
