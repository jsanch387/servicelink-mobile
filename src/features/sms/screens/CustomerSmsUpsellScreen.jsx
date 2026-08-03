import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button } from '../../../components/ui';
import { SCREEN_GUTTER } from '../../../constants/layout';
import { useAccountSettings } from '../../more/hooks/useAccountSettings';
import { getWebAccountAdminUrl } from '../../../lib/webAppOrigin';
import { useTheme } from '../../../theme';

const IMESSAGE_BLUE = '#0a84ff';

const HOLD_MS = 2200;
const EXIT_MS = 220;
const ENTER_MS = 280;
const EXIT_TRANSLATE_Y = -10;
const ENTER_START_TRANSLATE_Y = 10;

/**
 * Preview copy for the mock message bubble — the actual customer texts the
 * app sends over the job lifecycle, with sample placeholders filled in for
 * date/time/link since this screen isn't tied to a real booking.
 *
 * @param {string | null} businessName
 */
function buildPreviewMessages(businessName) {
  const name = businessName || 'Your business';
  return [
    'Your appointment is confirmed for Mon, Jun 15 at 2:00 PM. Questions? Contact your service provider.',
    `${name} is on the way for your appointment.`,
    'Your service has started.',
    'Your service is finished and ready for you.',
    'Your receipt is ready.\nIf you can please leave us a review, we would appreciate that.',
  ];
}

/**
 * Non-Pro upsell for customer texts — Subscribe opens web (App Store–safe).
 * Sells the feature with a mock message bubble that cycles through the real
 * job-lifecycle texts customers receive (confirmed → on the way → started →
 * finished → receipt/review), instead of copy alone.
 */
export function CustomerSmsUpsellScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { business } = useAccountSettings();
  const messages = useMemo(
    () => buildPreviewMessages(business?.business_name?.trim() || null),
    [business?.business_name],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          backgroundColor: colors.shell,
          flex: 1,
          justifyContent: 'center',
          paddingBottom: Math.max(insets.bottom, 20),
          paddingHorizontal: SCREEN_GUTTER,
        },
        stack: {
          alignItems: 'center',
          gap: 28,
          width: '100%',
        },
        iconWrap: {
          alignItems: 'center',
          borderRadius: 26,
          height: 72,
          justifyContent: 'center',
          overflow: 'hidden',
          width: 72,
          ...Platform.select({
            ios: {
              shadowColor: IMESSAGE_BLUE,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
            },
            android: { elevation: 6 },
          }),
        },
        iconGradient: {
          alignItems: 'center',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        },
        title: {
          color: colors.text,
          fontSize: 26,
          fontWeight: '800',
          letterSpacing: -0.6,
          lineHeight: 32,
          textAlign: 'center',
        },
        bubbleSlot: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 130,
          width: '100%',
        },
        bubbleRow: {
          alignSelf: 'center',
          flexDirection: 'row',
        },
        bubble: {
          backgroundColor: colors.buttonSecondaryBg,
          borderBottomLeftRadius: 4,
          borderColor: colors.border,
          borderRadius: 24,
          borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
          maxWidth: 288,
          paddingHorizontal: 18,
          paddingVertical: 14,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.45 : 0.1,
              shadowRadius: 16,
            },
            android: { elevation: 2 },
          }),
        },
        notifBody: {
          color: colors.text,
          fontSize: 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          lineHeight: 22,
          textAlign: 'left',
        },
        actions: {
          alignSelf: 'stretch',
          width: '100%',
        },
      }),
    [colors, insets.bottom, isDark],
  );

  return (
    <View style={styles.root}>
      <View style={styles.stack}>
        <View style={styles.iconWrap}>
          <LinearGradient
            colors={['#3aa0ff', IMESSAGE_BLUE]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.iconGradient}
          >
            <Ionicons color="#ffffff" name="chatbubble-ellipses" size={32} />
          </LinearGradient>
        </View>

        <AppText style={styles.title}>We text your customers for you</AppText>

        <RotatingMessageBubble messages={messages} styles={styles} />

        <View style={styles.actions}>
          <Button
            accessibilityHint="Opens ServiceLink on the web to manage your subscription"
            accessibilityLabel="Subscribe"
            fullWidth
            title="Subscribe"
            onPress={() => {
              void Linking.openURL(getWebAccountAdminUrl());
            }}
          />
        </View>
      </View>
    </View>
  );
}

/**
 * Cycles through `messages` in a single bubble slot — fades/slides the current
 * text out, swaps it, then fades/slides the next one in. Loops indefinitely.
 * Respects the OS "Reduce Motion" setting by holding on the first message.
 *
 * @param {{ messages: string[]; styles: Record<string, object> }} props
 */
function RotatingMessageBubble({ messages, styles }) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let reduceMotion = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotion = Boolean(enabled);
      })
      .catch(() => {})
      .finally(() => {
        if (cancelled || reduceMotion || messages.length < 2) {
          return;
        }
        runCycle();
      });

    function runCycle() {
      Animated.sequence([
        Animated.delay(HOLD_MS),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: EXIT_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: EXIT_TRANSLATE_Y,
            duration: EXIT_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (!finished || cancelled) {
          return;
        }
        setIndex((current) => (current + 1) % messages.length);
        translateY.setValue(ENTER_START_TRANSLATE_Y);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: ENTER_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: ENTER_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(({ finished: enterFinished }) => {
          if (enterFinished && !cancelled) {
            runCycle();
          }
        });
      });
    }

    return () => {
      cancelled = true;
    };
    // Intentionally run once — the cycle re-schedules itself via callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const currentBody = messages[index] ?? '';

  return (
    <View style={styles.bubbleSlot}>
      <Animated.View
        accessibilityLabel={`Example text message: ${currentBody}`}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        style={[styles.bubbleRow, { opacity, transform: [{ translateY }] }]}
      >
        <View style={styles.bubble}>
          <AppText numberOfLines={4} style={styles.notifBody}>
            {currentBody}
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}
