import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { useTheme } from '../../../theme';
import { buildCustomerSmsPreviewMessages } from '../utils/buildCustomerSmsPreviewMessages';
import {
  smsMessageTypeIcon,
  smsMessageTypeIconBackground,
  smsMessageTypeIconColor,
} from '../utils/smsMessagePresentation';

const HOLD_MS = 2200;
const EXIT_MS = 220;
const ENTER_MS = 280;
const EXIT_TRANSLATE_Y = -10;
const ENTER_START_TRANSLATE_Y = 10;

/**
 * Cycles through sample customer SMS bodies in one bubble — fade/slide out,
 * swap, fade/slide in. Used on the upsell screen and What’s new modal.
 *
 * @param {{
 *   businessName?: string | null;
 *   messages?: Array<{ type?: string; body: string } | string>;
 *   compact?: boolean;
 * }} props
 */
export function RotatingCustomerSmsBubble({
  businessName = null,
  messages: messagesProp,
  compact = false,
}) {
  const { colors, isDark } = useTheme();
  const messages = useMemo(() => {
    if (Array.isArray(messagesProp) && messagesProp.length > 0) {
      return messagesProp.map((entry) =>
        typeof entry === 'string' ? { type: null, body: entry } : entry,
      );
    }
    return buildCustomerSmsPreviewMessages(businessName);
  }, [businessName, messagesProp]);

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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        bubbleSlot: {
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: compact ? 96 : 130,
          width: '100%',
        },
        bubbleRow: {
          alignItems: 'flex-end',
          alignSelf: 'center',
          flexDirection: 'row',
          gap: compact ? 8 : 10,
          maxWidth: '100%',
        },
        iconBadge: {
          alignItems: 'center',
          borderRadius: compact ? 12 : 14,
          height: compact ? 32 : 36,
          justifyContent: 'center',
          marginBottom: 2,
          width: compact ? 32 : 36,
        },
        bubble: {
          backgroundColor: colors.buttonSecondaryBg,
          borderBottomLeftRadius: 4,
          borderColor: colors.border,
          borderRadius: compact ? 20 : 24,
          borderWidth: isDark ? 0 : StyleSheet.hairlineWidth,
          flexShrink: 1,
          maxWidth: compact ? 236 : 252,
          paddingHorizontal: compact ? 14 : 18,
          paddingVertical: compact ? 12 : 14,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: compact ? 6 : 8 },
              shadowOpacity: isDark ? 0.45 : 0.1,
              shadowRadius: compact ? 12 : 16,
            },
            android: { elevation: 2 },
          }),
        },
        body: {
          color: colors.text,
          fontSize: compact ? 14 : 16,
          fontWeight: '500',
          letterSpacing: -0.2,
          lineHeight: compact ? 20 : 22,
          textAlign: 'left',
        },
      }),
    [colors, compact, isDark],
  );

  const current = messages[index] ?? { type: null, body: '' };
  const currentBody = String(current.body ?? '');
  const iconName = smsMessageTypeIcon(current.type);
  const iconColor = smsMessageTypeIconColor(current.type);
  const iconBackground = smsMessageTypeIconBackground(current.type);
  const iconSize = compact ? 16 : 18;

  return (
    <View style={styles.bubbleSlot}>
      <Animated.View
        accessibilityLabel={`Example text message: ${currentBody}`}
        accessibilityLiveRegion="polite"
        accessibilityRole="text"
        style={[styles.bubbleRow, { opacity, transform: [{ translateY }] }]}
      >
        <View style={[styles.iconBadge, { backgroundColor: iconBackground }]}>
          <Ionicons color={iconColor} name={iconName} size={iconSize} />
        </View>
        <View style={styles.bubble}>
          <AppText numberOfLines={compact ? 5 : 4} style={styles.body}>
            {currentBody}
          </AppText>
        </View>
      </Animated.View>
    </View>
  );
}
